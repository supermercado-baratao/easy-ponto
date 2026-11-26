import { describe, expect, test } from 'vitest'

import type { TJustificationWithType } from '@/infra/database/types'

import {
  getJustificationLabel,
  getJustificationShortLabel
} from './justification'

const createJustification = (
  fields: Partial<TJustificationWithType>
): TJustificationWithType =>
  ({
    startDate: '2025-10-06',
    endDate: '2025-10-06',
    startTime: null,
    endTime: null,
    note: null,
    type: { name: 'Abono' },
    ...fields
  }) as TJustificationWithType

describe('getJustificationLabel', () => {
  test('Names the type, the period and the times', () => {
    expect(
      getJustificationLabel(
        createJustification({ startTime: 840, endTime: 940 })
      )
    ).toBe('Abono, 06/10/2025, 14:00–15:40')
    expect(
      getJustificationLabel(createJustification({ endDate: '2025-10-08' }))
    ).toBe('Abono, 06/10/2025 a 08/10/2025')
  })

  test('Ends with the note, which the short label leaves out', () => {
    const justification = createJustification({
      note: 'Falecimento do tio'
    })

    expect(getJustificationLabel(justification)).toBe(
      'Abono, 06/10/2025, Falecimento do tio'
    )
    expect(getJustificationShortLabel(justification)).toBe('Abono')
  })
})
