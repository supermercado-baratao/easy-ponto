import { beforeAll, describe, expect, test } from 'vitest'

import { KnownError } from '@/infra/errors'
import { companyModel } from '@/models/company/model'
import { PendingItemNotFoundError } from '@/models/pending-item/errors'
import { pendingItemModel } from '@/models/pending-item/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const ADMIN_NAME = 'Admin das Pendências'

let companyId: string
let otherCompanyId: string
let adminId: string
let scheduledUserId: string
let unscheduledUserId: string
let dismissedUserId: string

const getKeys = (items: { key: string }[]): string[] =>
  items.map(({ key }) => key)

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  ;({ id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  ))
  ;({ id: otherCompanyId } = await companyModel.create(
    orchestrator.createCompanyData()
  ))
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 3), companyId)
  )
  ;[
    { id: scheduledUserId },
    { id: unscheduledUserId },
    { id: dismissedUserId }
  ] = await userModel.findManyByCompanyId(companyId)
  await userModel.update({
    id: dismissedUserId,
    companyId,
    status: 'dismissed'
  })
  await orchestrator.assignShift({
    companyId,
    userId: scheduledUserId,
    startDate: '2026-01-01',
    days: [['07:00', '19:00']]
  })
  adminId = await orchestrator.createMember({
    companyId,
    role: 'admin',
    name: ADMIN_NAME,
    email: 'admin-das-pendencias@easy-ponto.test',
    password: 'senha-do-admin'
  })
})

describe('pendingItemModel', () => {
  test('Lists the open items of the active employees, from the current data', async () => {
    const { open, dismissed } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: true
    })
    const keys = getKeys(open)

    expect(dismissed).toEqual([])
    expect(keys).toContain('company-setup:device')
    expect(keys).toContain('company-setup:overtime-bands')
    expect(keys).not.toContain('company-setup:company')
    expect(keys).toContain(`user-without-schedule:${unscheduledUserId}`)
    expect(keys).not.toContain(`user-without-schedule:${scheduledUserId}`)
    expect(keys.some((key) => key.includes(dismissedUserId))).toBe(false)
    expect(
      open.filter(
        (item) =>
          item.type === 'schedule-alert' && item.user.id === scheduledUserId
      )
    ).toHaveLength(14)
  })

  test('Leaves a fixed case out of the list', async () => {
    await orchestrator.createOvertimeBands(companyId)

    const { open } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: true
    })

    expect(getKeys(open)).not.toContain('company-setup:overtime-bands')
  })

  test('Leaves the company setup out for who only views', async () => {
    const { open } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: false
    })
    const keys = getKeys(open)

    expect(keys).not.toContain('company-setup:device')
    expect(keys).toContain(`user-without-schedule:${unscheduledUserId}`)
  })

  test('Moves a dismissed item to the dismissed list, with who dismissed it', async () => {
    const key = `user-without-schedule:${unscheduledUserId}`
    const countBefore = await pendingItemModel.countOpen({
      companyId,
      canEdit: true
    })

    await pendingItemModel.dismiss({ companyId, key, dismissedById: adminId })
    const { open, dismissed } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: true
    })

    expect(getKeys(open)).not.toContain(key)
    expect(dismissed).toEqual([
      expect.objectContaining({
        key,
        type: 'user-without-schedule',
        dismissedByName: ADMIN_NAME,
        dismissedAt: expect.any(Date)
      })
    ])
    expect(await pendingItemModel.countOpen({ companyId, canEdit: true })).toBe(
      countBefore - 1
    )
  })

  test('Keeps the dismissals of a company apart from the others', async () => {
    await expect(
      pendingItemModel.dismiss({
        companyId: otherCompanyId,
        key: `user-without-schedule:${unscheduledUserId}`,
        dismissedById: adminId
      })
    ).rejects.toBeInstanceOf(PendingItemNotFoundError)

    const { dismissed } = await pendingItemModel.findManyByCompanyId({
      companyId: otherCompanyId,
      canEdit: true
    })
    expect(dismissed).toEqual([])
  })

  test('Brings a restored item back to the open list', async () => {
    const key = `user-without-schedule:${unscheduledUserId}`

    await pendingItemModel.restore({ companyId, key })
    const { open, dismissed } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: true
    })

    expect(getKeys(open)).toContain(key)
    expect(dismissed).toEqual([])
    await expect(
      pendingItemModel.restore({ companyId, key })
    ).rejects.toBeInstanceOf(PendingItemNotFoundError)
  })

  test('Refuses to dismiss a case that no longer exists', async () => {
    await expect(
      pendingItemModel.dismiss({
        companyId,
        key: `user-without-schedule:${scheduledUserId}`,
        dismissedById: adminId
      })
    ).rejects.toBeInstanceOf(PendingItemNotFoundError)
  })

  test('Never dismisses the company setup', async () => {
    const dismissal = pendingItemModel.dismiss({
      companyId,
      key: 'company-setup:device',
      dismissedById: adminId
    })

    await expect(dismissal).rejects.toBeInstanceOf(Error)
    await expect(dismissal).rejects.not.toBeInstanceOf(KnownError)
    const { open } = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit: true
    })
    expect(getKeys(open)).toContain('company-setup:device')
  })
})
