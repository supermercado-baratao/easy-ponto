import { describe, expect, test } from 'vitest'

import {
  getActiveFunctionIds,
  getMainFunction,
  getMissingPayrollPositions,
  getUserFunctions
} from './utils'

const functions = [
  { id: 'manager', name: 'Encarregado', level: 3 },
  { id: 'cashier', name: 'Operador de caixa', level: 2 },
  { id: 'stocker', name: 'Repositor', level: 1 }
]

describe('getUserFunctions', () => {
  test('Takes the level of the payroll position from the function with its name', () => {
    expect(
      getUserFunctions(
        {
          position: 'repositor',
          payrollPositionActive: true,
          jobFunctions: []
        },
        functions
      )
    ).toEqual([
      {
        jobFunctionId: 'stocker',
        name: 'repositor',
        level: 1,
        payroll: true,
        active: true
      }
    ])
  })

  test('Keeps a payroll position without a function, with no level', () => {
    expect(
      getUserFunctions(
        {
          position: 'Açougueiro',
          payrollPositionActive: true,
          jobFunctions: []
        },
        functions
      )
    ).toEqual([
      expect.objectContaining({
        jobFunctionId: null,
        level: null,
        payroll: true
      })
    ])
  })

  test('Leaves out a function that repeats the payroll position', () => {
    const userFunctions = getUserFunctions(
      {
        position: 'Repositor',
        payrollPositionActive: true,
        jobFunctions: [{ jobFunctionId: 'stocker', active: false }]
      },
      functions
    )
    expect(userFunctions).toHaveLength(1)
    expect(userFunctions[0]).toMatchObject({ payroll: true, active: true })
  })
})

describe('getMainFunction', () => {
  test('Picks the active function of the highest level, even above the payroll position', () => {
    const userFunctions = getUserFunctions(
      {
        position: 'Repositor',
        payrollPositionActive: true,
        jobFunctions: [
          { jobFunctionId: 'cashier', active: true },
          { jobFunctionId: 'manager', active: false }
        ]
      },
      functions
    )
    expect(getMainFunction(userFunctions)?.name).toBe('Operador de caixa')
  })

  test('Skips an inactive payroll position', () => {
    const userFunctions = getUserFunctions(
      {
        position: 'Encarregado',
        payrollPositionActive: false,
        jobFunctions: [{ jobFunctionId: 'stocker', active: true }]
      },
      functions
    )
    expect(getMainFunction(userFunctions)?.name).toBe('Repositor')
  })

  test('Returns nothing when no function is active', () => {
    expect(
      getMainFunction(
        getUserFunctions(
          {
            position: 'Repositor',
            payrollPositionActive: false,
            jobFunctions: []
          },
          functions
        )
      )
    ).toBeNull()
  })
})

describe('getActiveFunctionIds', () => {
  test('Includes the active payroll position and the other active functions', () => {
    expect(
      getActiveFunctionIds(
        {
          position: 'Repositor',
          payrollPositionActive: true,
          jobFunctions: [
            { jobFunctionId: 'cashier', active: true },
            { jobFunctionId: 'manager', active: false }
          ]
        },
        functions
      )
    ).toEqual(new Set(['stocker', 'cashier']))
  })
})

describe('getMissingPayrollPositions', () => {
  test('Lists each payroll position without a function once, whatever the case', () => {
    expect(
      getMissingPayrollPositions(
        ['Açougueiro', 'açougueiro ', 'Repositor', null, ' ', 'Padeiro'],
        functions
      )
    ).toEqual(['Açougueiro', 'Padeiro'])
  })
})
