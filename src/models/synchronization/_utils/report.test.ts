import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import type {
  TReportPunchRecord,
  TReportSchedule,
  TReportUser
} from '@/models/time-card-report/types'

import {
  getInitialBalancesToSave,
  getPunchRecordsToCreate,
  getSchedulesToSave,
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

describe('getSchedulesToSave', () => {
  test('Returns the schedules of the saved users with the same name', () => {
    const users = [
      { id: '1', companyId: 'company', name: 'Maria Teste' }
    ] as User[]
    const schedules: TReportSchedule[] = [
      {
        userName: 'Maria Teste',
        startDate: '2025-10-01',
        mondayEntry1: '07:00',
        mondayExit1: '11:00'
      },
      { userName: 'Ana Teste', startDate: '2025-10-01' }
    ]

    expect(getSchedulesToSave(schedules, users)).toEqual([
      {
        companyId: 'company',
        userId: '1',
        startDate: '2025-10-01',
        mondayEntry1: '07:00',
        mondayExit1: '11:00'
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
  test('Matches the balances to the users by name and lists the unmatched names', () => {
    const users = [{ id: 'user-1', name: 'Maria Teste' }] as User[]
    const totals = {
      absence: 60,
      dayOff: 0,
      overtime60: 30,
      overtime100: 0,
      adjustment: 0
    }

    const result = getInitialBalancesToSave(
      [
        { userName: 'Maria Teste', ...totals },
        { userName: 'Former Employee', ...totals }
      ],
      users
    )

    expect(result).toEqual({
      balances: [{ userId: 'user-1', ...totals }],
      unmatchedNames: ['Former Employee']
    })
  })
})
