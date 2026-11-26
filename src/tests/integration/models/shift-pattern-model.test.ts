import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import type { TShiftPatternWithVersions } from '@/infra/database/types'
import { NotFoundError } from '@/infra/errors'
import { companyModel } from '@/models/company/model'
import { LastShiftPatternVersionError } from '@/models/shift-pattern/errors'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import orchestrator from '@/tests/orchestrator'

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.create({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  return id
}

const TWELVE_BY_THIRTY_SIX = {
  cycleLength: '2',
  day1Entry1: '19:00',
  day1Exit1: '07:00'
}

const SIX_BY_ONE = {
  cycleLength: '7',
  ...Object.fromEntries(
    [1, 2, 3, 4, 5, 6].flatMap((day) => [
      [`day${day}Entry1`, '08:00'],
      [`day${day}Exit1`, '12:00'],
      [`day${day}Entry2`, '13:00'],
      [`day${day}Exit2`, '16:20']
    ])
  )
}

const getFieldErrors = async (
  promise: Promise<unknown>
): Promise<{ path: string; message: string }[]> => {
  let error: unknown
  try {
    await promise
  } catch (error_) {
    error = error_
  }
  expect(error).toBeInstanceOf(z.ZodError)
  return (error as z.ZodError).issues.map(({ path, message }) => ({
    path: path.join('.'),
    message
  }))
}

let companyId: string
let otherCompanyId: string
let shiftPattern: TShiftPatternWithVersions

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
})

describe('Shift Pattern Model', () => {
  test('Creates a pattern with its first version', async () => {
    shiftPattern = await shiftPatternModel.create({
      companyId,
      name: '12x36 noturno',
      startDate: '2026-01-01',
      ...TWELVE_BY_THIRTY_SIX
    })

    expect(shiftPattern.versions).toHaveLength(1)
    expect(shiftPattern.versions[0]).toMatchObject({
      startDate: '2026-01-01',
      cycleLength: 2
    })
    expect(
      shiftPattern.versions[0].days.map(({ cycleDay, entry1, exit1 }) => [
        cycleDay,
        entry1,
        exit1
      ])
    ).toEqual([
      [1, 1140, 1860],
      [2, null, null]
    ])
  })

  test('Refuses a name already used in the company, whatever the case', async () => {
    expect(
      await getFieldErrors(
        shiftPatternModel.create({
          companyId,
          name: '12X36 Noturno',
          startDate: '2026-01-01',
          ...TWELVE_BY_THIRTY_SIX
        })
      )
    ).toEqual([{ path: 'name', message: 'Já existe uma escala com esse nome' }])

    const other = await shiftPatternModel.create({
      companyId: otherCompanyId,
      name: '12x36 noturno',
      startDate: '2026-01-01',
      ...TWELVE_BY_THIRTY_SIX
    })
    expect(other.companyId).toBe(otherCompanyId)
  })

  test('Adds a version from a date and keeps the previous one', async () => {
    shiftPattern = await shiftPatternModel.update({
      id: shiftPattern.id,
      companyId,
      name: 'Escala da loja',
      startDate: '2026-03-01',
      ...SIX_BY_ONE
    })

    expect(shiftPattern.name).toBe('Escala da loja')
    expect(
      shiftPattern.versions.map(({ startDate, cycleLength, days }) => [
        startDate,
        cycleLength,
        days.length
      ])
    ).toEqual([
      ['2026-03-01', 7, 7],
      ['2026-01-01', 2, 2]
    ])
  })

  test('Edits a version, replacing its days', async () => {
    const [latest, previous] = shiftPattern.versions
    shiftPattern = await shiftPatternModel.update({
      id: shiftPattern.id,
      versionId: latest.id,
      companyId,
      name: 'Escala da loja',
      startDate: '2026-04-01',
      ...TWELVE_BY_THIRTY_SIX
    })

    expect(
      shiftPattern.versions.map(({ id, startDate, days }) => [
        id,
        startDate,
        days.length
      ])
    ).toEqual([
      [latest.id, '2026-04-01', 2],
      [previous.id, '2026-01-01', 2]
    ])
  })

  test('Refuses two versions with the same start date', async () => {
    expect(
      await getFieldErrors(
        shiftPatternModel.update({
          id: shiftPattern.id,
          companyId,
          name: 'Escala da loja',
          startDate: '2026-01-01',
          ...SIX_BY_ONE
        })
      )
    ).toEqual([
      { path: 'startDate', message: 'Já existe uma versão com essa data' }
    ])
  })

  test('Refuses a pattern or a version of another company', async () => {
    await expect(
      shiftPatternModel.update({
        id: shiftPattern.id,
        companyId: otherCompanyId,
        name: 'Escala da loja',
        startDate: '2026-05-01',
        ...SIX_BY_ONE
      })
    ).rejects.toBeInstanceOf(NotFoundError)

    const [other] = await shiftPatternModel.findManyByCompanyId(otherCompanyId)
    await expect(
      shiftPatternModel.update({
        id: shiftPattern.id,
        versionId: other.versions[0].id,
        companyId,
        name: 'Escala da loja',
        startDate: '2026-05-01',
        ...SIX_BY_ONE
      })
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      shiftPatternModel.removeVersion({ id: other.versions[0].id, companyId })
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      shiftPatternModel.remove({ id: other.id, companyId })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('Removes a version but never the last one', async () => {
    const [latest, previous] = shiftPattern.versions
    shiftPattern = await shiftPatternModel.removeVersion({
      id: latest.id,
      companyId
    })
    expect(shiftPattern.versions.map(({ id }) => id)).toEqual([previous.id])

    await expect(
      shiftPatternModel.removeVersion({ id: previous.id, companyId })
    ).rejects.toBeInstanceOf(LastShiftPatternVersionError)
  })

  test('Removes a pattern with its versions', async () => {
    await shiftPatternModel.remove({ id: shiftPattern.id, companyId })

    expect(await shiftPatternModel.findManyByCompanyId(companyId)).toEqual([])
    expect(
      await shiftPatternModel.findManyByCompanyId(otherCompanyId)
    ).toHaveLength(1)
  })
})
