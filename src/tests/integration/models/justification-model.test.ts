import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import { justificationModel } from '@/models/justification/model'
import { JustificationTypeInUseError } from '@/models/justification-type/errors'
import { justificationTypeModel } from '@/models/justification-type/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const createCompanyWithUser = async (
  deviceUserIndex: number
): Promise<{ companyId: string; userId: string }> => {
  const { id: companyId } = await companyModel.upsert({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  await userModel.createMany(
    mapDeviceUserToUser(
      deviceUsers.slice(deviceUserIndex, deviceUserIndex + 1),
      companyId
    )
  )
  const [{ id: userId }] = await userModel.findManyByCompanyId(companyId)
  return { companyId, userId }
}

let companyId: string
let userId: string
let otherCompanyId: string
let otherUserId: string
let typeId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  ;({ companyId, userId } = await createCompanyWithUser(0))
  ;({ companyId: otherCompanyId, userId: otherUserId } =
    await createCompanyWithUser(1))
})

describe('Justification Type Model', () => {
  test('Creates, updates and lists the types of the company ordered by code', async () => {
    const type = await justificationTypeModel.create({
      companyId,
      code: 'ATEST',
      description: 'Atestado',
      effect: 'excuse'
    })
    typeId = type.id
    await justificationTypeModel.create({
      companyId,
      code: 'FOLGA',
      description: 'Folga',
      effect: 'deduct'
    })

    await justificationTypeModel.update({
      id: type.id,
      companyId,
      code: 'ATEST',
      description: 'Atestado médico',
      effect: 'excuse'
    })

    const types = await justificationTypeModel.findManyByCompanyId(companyId)
    expect(types.map(({ code, description }) => [code, description])).toEqual([
      ['ATEST', 'Atestado médico'],
      ['FOLGA', 'Folga']
    ])
    expect(
      await justificationTypeModel.findManyByCompanyId(otherCompanyId)
    ).toEqual([])
  })

  test('Rejects a code already used in the company', async () => {
    const promise = justificationTypeModel.create({
      companyId,
      code: ' FOLGA ',
      description: 'Outra folga',
      effect: 'deduct'
    })

    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [{ path: ['code'], message: 'Já existe um tipo com esse código' }]
    })
    await expect(
      justificationTypeModel.create({
        companyId: otherCompanyId,
        code: 'FOLGA',
        description: 'Folga',
        effect: 'deduct'
      })
    ).resolves.toMatchObject({ code: 'FOLGA' })
  })
})

describe('Justification Model', () => {
  test('Creates, updates and removes a justification of the employee', async () => {
    const justification = await justificationModel.create({
      companyId,
      userId,
      typeId,
      startDate: '2026-11-10',
      endDate: '2026-11-10',
      startTime: '14:00',
      endTime: '15:40',
      note: 'Consulta'
    })

    const updated = await justificationModel.update({
      id: justification.id,
      companyId,
      userId,
      typeId,
      startDate: '2026-11-10',
      endDate: '2026-11-12'
    })
    expect(updated).toMatchObject({
      startDate: '2026-11-10',
      endDate: '2026-11-12',
      startTime: null,
      endTime: null,
      note: null
    })

    const justifications = await justificationModel.findManyInPeriod({
      userId,
      initialDate: '2026-11-12',
      finalDate: '2026-11-30'
    })
    expect(justifications).toMatchObject([
      { id: justification.id, type: { code: 'ATEST' } }
    ])

    await justificationModel.remove({ id: justification.id, companyId })
    expect(
      await justificationModel.findManyInPeriod({
        userId,
        initialDate: '2026-11-01',
        finalDate: '2026-11-30'
      })
    ).toEqual([])
  })

  test('Rejects a justification that overlaps another one of the employee', async () => {
    const morning = await justificationModel.create({
      companyId,
      userId,
      typeId,
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      startTime: '07:00',
      endTime: '11:00'
    })
    await expect(
      justificationModel.create({
        companyId,
        userId,
        typeId,
        startDate: '2026-12-01',
        endDate: '2026-12-01',
        startTime: '13:00',
        endTime: '16:20'
      })
    ).resolves.toBeDefined()

    const promise = justificationModel.create({
      companyId,
      userId,
      typeId,
      startDate: '2026-11-30',
      endDate: '2026-12-02'
    })
    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [
        {
          path: ['startDate'],
          message:
            'Já existe uma justificativa nesse período: ATEST (01/12/2026)'
        }
      ]
    })

    await expect(
      justificationModel.update({
        id: morning.id,
        companyId,
        userId,
        typeId,
        startDate: '2026-12-01',
        endDate: '2026-12-01',
        startTime: '08:00',
        endTime: '11:00'
      })
    ).resolves.toMatchObject({ startTime: 480 })
  })

  test('Does not remove a justification type in use', async () => {
    const promise = justificationTypeModel.remove({ id: typeId, companyId })
    await expect(promise).rejects.toBeInstanceOf(JustificationTypeInUseError)
    await expect(promise).rejects.toThrow(
      'O tipo ATEST está em uso em justificativas.'
    )

    const types = await justificationTypeModel.findManyByCompanyId(companyId)
    const dayOff = types.find(({ code }) => code === 'FOLGA')!
    await justificationTypeModel.remove({ id: dayOff.id, companyId })
    const remaining =
      await justificationTypeModel.findManyByCompanyId(companyId)
    expect(remaining.map(({ code }) => code)).toEqual(['ATEST'])
  })

  test('Does not use or change the data of another company', async () => {
    const [otherType] =
      await justificationTypeModel.findManyByCompanyId(otherCompanyId)
    const otherJustification = await justificationModel.create({
      companyId: otherCompanyId,
      userId: otherUserId,
      typeId: otherType.id,
      startDate: '2026-11-10',
      endDate: '2026-11-10'
    })

    await expect(
      justificationModel.create({
        companyId,
        userId: otherUserId,
        typeId,
        startDate: '2026-11-20',
        endDate: '2026-11-20'
      })
    ).rejects.toThrow(`User ${otherUserId} not found in company ${companyId}`)
    await expect(
      justificationModel.create({
        companyId,
        userId,
        typeId: otherType.id,
        startDate: '2026-11-20',
        endDate: '2026-11-20'
      })
    ).rejects.toThrow(
      `JustificationType ${otherType.id} not found in company ${companyId}`
    )
    await expect(
      justificationModel.remove({ id: otherJustification.id, companyId })
    ).rejects.toThrow(
      `Justification ${otherJustification.id} not found in company ${companyId}`
    )
    await expect(
      justificationTypeModel.update({
        id: otherType.id,
        companyId,
        code: 'OUTRO',
        description: 'Outro',
        effect: 'excuse'
      })
    ).rejects.toThrow(
      `JustificationType ${otherType.id} not found in company ${companyId}`
    )
  })
})
