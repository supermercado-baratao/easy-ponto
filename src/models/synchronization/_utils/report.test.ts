import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import type {
  TReportPunchRecord,
  TReportUser
} from '@/models/time-card-report/types'

import {
  getInitialBalancesToSave,
  getPunchRecordsToCreate,
  getUsersToUpdate
} from './report'

describe('getUsersToUpdate', () => {
  test('Merges the report data into the saved users with the same name', () => {
    const savedUsers = [
      { id: '1', name: 'Maria Teste', pis: '000000000001', cpf: null },
      { id: '2', name: 'João Teste', pis: '000000000002', cpf: null }
    ] as User[]
    const users = [
      { name: 'Maria Teste', cpf: '52998224725', position: 'Caixa' },
      { name: 'Ana Teste', cpf: null, position: 'Gerente' }
    ] as TReportUser[]

    expect(getUsersToUpdate(savedUsers, users)).toEqual([
      {
        id: '1',
        name: 'Maria Teste',
        pis: '000000000001',
        cpf: '52998224725',
        position: 'Caixa'
      }
    ])
  })
})

describe('getPunchRecordsToCreate', () => {
  test('Returns only the records missing from the AFD of saved users', () => {
    const users = [{ name: 'Maria Teste', pis: '000000000001' }] as User[]
    const datetime = new Date('2025-10-01T13:00:00.000Z')
    const punchRecords: TReportPunchRecord[] = [
      { userName: 'Maria Teste', datetime, afdDatetime: null },
      { userName: 'Maria Teste', datetime, afdDatetime: datetime },
      { userName: 'Ana Teste', datetime, afdDatetime: null }
    ]

    expect(getPunchRecordsToCreate(punchRecords, users)).toEqual([
      { pis: '000000000001', datetime }
    ])
  })
})

describe('getInitialBalancesToSave', () => {
  const totals = {
    absence: 60,
    overtime: [{ percentage: 60, minutes: 30 }],
    adjustment: 0
  }

  test('Matches the balances to the users by name and lists the unmatched names', () => {
    const users = [{ id: 'user-1', name: 'Maria Teste' }] as User[]

    const result = getInitialBalancesToSave(
      [
        { userName: 'Maria Teste', ...totals, justificationMinutes: {} },
        { userName: 'Former Employee', ...totals, justificationMinutes: {} }
      ],
      users,
      new Set()
    )

    expect(result).toEqual({
      balances: [{ userId: 'user-1', ...totals, compensation: 0 }],
      unmatchedNames: ['Former Employee']
    })
  })

  test('Deducts only the minutes of the codes whose type deducts from the hours bank', () => {
    const users = [{ id: 'user-1', name: 'Maria Teste' }] as User[]

    const { balances } = getInitialBalancesToSave(
      [
        {
          userName: 'Maria Teste',
          ...totals,
          justificationMinutes: { FOLGA: 640, COMP: 200, ATESTADO: 440 }
        }
      ],
      users,
      new Set(['FOLGA', 'COMP'])
    )

    expect(balances[0].compensation).toBe(840)
  })
})
