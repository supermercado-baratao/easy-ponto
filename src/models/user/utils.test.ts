import { describe, expect, test } from 'vitest'

import { filterUsers, getPositions } from './utils'

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
