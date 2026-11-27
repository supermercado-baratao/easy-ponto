import { describe, expect, test } from 'vitest'

import {
  filterUsers,
  filterUsersByOrganization,
  getPositions,
  resolveOrganizationFilters
} from './utils'

const users = [
  { name: 'João Conceição', position: 'Caixa', status: 'registered' },
  { name: 'Maria Souza', position: 'Repositor', status: 'probation' },
  { name: 'José Antônio', position: 'Caixa', status: 'on-leave' },
  { name: 'Ana Lima', position: null, status: 'dismissed' }
]

const names = (filtered: typeof users): string[] =>
  filtered.map(({ name }) => name)

describe('filterUsers', () => {
  test('Hides the dismissed users when no status is given', () => {
    expect(names(filterUsers(users, {}))).toEqual([
      'João Conceição',
      'Maria Souza',
      'José Antônio'
    ])
  })

  test('Shows the dismissed users when their status is given', () => {
    expect(names(filterUsers(users, { status: 'dismissed' }))).toEqual([
      'Ana Lima'
    ])
  })

  test('Shows every user when all the statuses are asked', () => {
    expect(filterUsers(users, { status: 'all' })).toHaveLength(users.length)
  })

  test('Matches part of the name ignoring accents and case', () => {
    expect(names(filterUsers(users, { name: 'CONCEICAO' }))).toEqual([
      'João Conceição'
    ])
    expect(names(filterUsers(users, { name: 'jose ant' }))).toEqual([
      'José Antônio'
    ])
  })

  test('Combines the name, position and status filters', () => {
    expect(
      names(
        filterUsers(users, {
          name: 'jo',
          position: 'Caixa',
          status: 'on-leave'
        })
      )
    ).toEqual(['José Antônio'])
  })
})

describe('getPositions', () => {
  test('Lists each position once, sorted, without the empty ones', () => {
    expect(
      getPositions([...users, { position: 'Açougueiro' }, { position: '  ' }])
    ).toEqual(['Açougueiro', 'Caixa', 'Repositor'])
  })
})

const organization = {
  groups: [
    { id: 'replenishment', name: 'Reposição', parentId: null },
    { id: 'cereals', name: 'Cereais', parentId: 'replenishment' },
    { id: 'cashier', name: 'Caixa', parentId: null }
  ],
  jobFunctions: [
    { id: 'stocker', name: 'Repositor', level: 1 },
    { id: 'operator', name: 'Operador de caixa', level: 2 }
  ]
}

const organizedUsers = [
  {
    name: 'Carla',
    position: 'Repositor',
    payrollPositionActive: true,
    groupIds: ['cereals'],
    jobFunctions: [{ jobFunctionId: 'operator', active: true }]
  },
  {
    name: 'Bruno',
    position: 'Repositor',
    payrollPositionActive: false,
    groupIds: ['replenishment'],
    jobFunctions: []
  },
  {
    name: 'Diana',
    position: 'Operador de caixa',
    payrollPositionActive: true,
    groupIds: ['cashier'],
    jobFunctions: [{ jobFunctionId: 'stocker', active: false }]
  }
]

const organizedNames = (filtered: typeof organizedUsers): string[] =>
  filtered.map(({ name }) => name)

describe('filterUsersByOrganization', () => {
  test('Includes the employees of the groups inside the given one', () => {
    expect(
      organizedNames(
        filterUsersByOrganization(
          organizedUsers,
          { groupId: 'replenishment' },
          organization
        )
      )
    ).toEqual(['Carla', 'Bruno'])
  })

  test('Matches the active functions, including the payroll position', () => {
    expect(
      organizedNames(
        filterUsersByOrganization(
          organizedUsers,
          { jobFunctionId: 'stocker' },
          organization
        )
      )
    ).toEqual(['Carla'])
    expect(
      organizedNames(
        filterUsersByOrganization(
          organizedUsers,
          { jobFunctionId: 'operator' },
          organization
        )
      )
    ).toEqual(['Carla', 'Diana'])
  })
})

describe('resolveOrganizationFilters', () => {
  test('Finds the group and the function by name, whatever the case', () => {
    expect(
      resolveOrganizationFilters(organization, {
        group: 'cereais',
        jobFunction: ' REPOSITOR '
      })
    ).toEqual({
      groupId: 'cereals',
      jobFunctionId: 'stocker',
      group: 'Cereais',
      jobFunction: 'Repositor'
    })
  })

  test('Ignores a name that no group or function has', () => {
    expect(
      resolveOrganizationFilters(organization, { group: 'Padaria' })
    ).toEqual({
      groupId: undefined,
      jobFunctionId: undefined,
      group: null,
      jobFunction: null
    })
  })
})
