import { describe, expect, test } from 'vitest'

import type {
  TRestRestrictionWithRelations,
  User
} from '@/infra/database/types'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

import {
  findRestBreaks,
  findRestrictionBreaks,
  getOffDays,
  toRestRestrictionInput,
  type TRestRestrictionInput
} from './utils'

// Monday, March 1, 2027
const MONDAY = '2027-03-01'

const day = (kind: TResolvedDay['kind'], adjusted = false): TResolvedDay => ({
  date: MONDAY,
  kind,
  pairs: [],
  adjusted
})

const createRestriction = (
  restriction: Partial<TRestRestrictionInput> = {}
): TRestRestrictionInput => ({
  id: 'restriction',
  kind: 'group',
  level: 'required',
  maxOff: 2,
  weekdays: [],
  userNames: [],
  groupName: 'Caixa',
  userIds: ['ana', 'bruno', 'carla'],
  ...restriction
})

describe('findRestrictionBreaks', () => {
  const offDays = getOffDays([
    { userId: 'ana', days: [day('off')] },
    { userId: 'bruno', days: [day('off')] },
    { userId: 'carla', days: [day('work')] }
  ])

  test('Breaks a limit when the others off already reach it', () => {
    const restriction = createRestriction()

    expect(
      findRestrictionBreaks({
        restrictions: [restriction],
        offDays,
        userId: 'carla',
        date: MONDAY
      })
    ).toEqual([restriction])
    expect(
      findRestrictionBreaks({
        restrictions: [restriction],
        offDays,
        userId: 'ana',
        date: MONDAY
      })
    ).toEqual([])
  })

  test('Ignores the restrictions of other employees', () => {
    expect(
      findRestrictionBreaks({
        restrictions: [createRestriction({ maxOff: 1, userIds: ['ana'] })],
        offDays,
        userId: 'bruno',
        date: MONDAY
      })
    ).toEqual([])
  })

  test('Breaks the forbidden weekdays of the employee', () => {
    const restriction = createRestriction({
      kind: 'weekdays',
      maxOff: null,
      weekdays: [1],
      userIds: ['carla']
    })

    expect(
      findRestrictionBreaks({
        restrictions: [restriction],
        offDays,
        userId: 'carla',
        date: MONDAY
      })
    ).toEqual([restriction])
    expect(
      findRestrictionBreaks({
        restrictions: [restriction],
        offDays,
        userId: 'carla',
        date: '2027-03-02'
      })
    ).toEqual([])
  })
})

describe('findRestBreaks', () => {
  test('Lists each day off over a limit, telling the adjusted ones apart', () => {
    const breaks = findRestBreaks({
      restrictions: [createRestriction({ maxOff: 1 })],
      users: [
        { userId: 'ana', days: [day('off')] },
        { userId: 'bruno', days: [day('off', true)] },
        { userId: 'carla', days: [day('work')] }
      ]
    })

    expect(
      breaks.map(({ userId, date, adjusted }) => ({ userId, date, adjusted }))
    ).toEqual([
      { userId: 'ana', date: MONDAY, adjusted: false },
      { userId: 'bruno', date: MONDAY, adjusted: true }
    ])
    expect(breaks[0].restriction).not.toHaveProperty('userIds')
  })
})

const user = (id: string, name: string): User => ({ id, name }) as User

describe('toRestRestrictionInput', () => {
  test('Counts the members of the groups inside the group of a limit', () => {
    const restriction = {
      id: 'restriction',
      kind: 'group',
      level: 'required',
      maxOff: 1,
      userGroupId: 'store',
      userId: null,
      weekdays: [],
      users: [],
      group: null,
      user: null
    } as unknown as TRestRestrictionWithRelations

    const input = toRestRestrictionInput(restriction, {
      groups: [
        { id: 'store', name: 'Loja', parentId: null },
        { id: 'cashier', name: 'Caixa', parentId: 'store' },
        { id: 'bakery', name: 'Padaria', parentId: null }
      ],
      members: [
        { groupId: 'store', userId: 'ana' },
        { groupId: 'cashier', userId: 'bruno' },
        { groupId: 'cashier', userId: 'ana' },
        { groupId: 'bakery', userId: 'carla' }
      ]
    })

    expect(input.userIds.toSorted((a, b) => a.localeCompare(b))).toEqual([
      'ana',
      'bruno'
    ])
    expect(input.groupName).toBe('Loja')
  })

  test('Lists the names of the employees that rest apart in alphabetical order', () => {
    const restriction = {
      id: 'restriction',
      kind: 'together',
      level: 'preferred',
      maxOff: 1,
      userGroupId: null,
      userId: null,
      weekdays: [],
      users: [
        { userId: 'carla', user: user('carla', 'Carla') },
        { userId: 'ana', user: user('ana', 'Ana') }
      ],
      group: null,
      user: null
    } as unknown as TRestRestrictionWithRelations

    expect(
      toRestRestrictionInput(restriction, { groups: [], members: [] })
    ).toMatchObject({ userIds: ['carla', 'ana'], userNames: ['Ana', 'Carla'] })
  })
})
