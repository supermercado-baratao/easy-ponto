import { describe, expect, test } from 'vitest'

import { createAdjustmentSchema } from './schema'

const parseMinutes = (
  minutes: string
): ReturnType<typeof createAdjustmentSchema.safeParse> =>
  createAdjustmentSchema.safeParse({
    companyId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    date: '2026-11-13',
    minutes,
    reason: 'Correção'
  })

describe('createAdjustmentSchema', () => {
  test('Reads the adjustment as signed minutes', () => {
    expect(parseMinutes('01:30').data?.minutes).toBe(90)
    expect(parseMinutes('+12:05').data?.minutes).toBe(725)
    expect(parseMinutes('-00:45').data?.minutes).toBe(-45)
  })

  test('Rejects an adjustment of zero or out of the format', () => {
    expect(parseMinutes('00:00').error?.issues[0].message).toBe(
      'O ajuste não pode ser zero'
    )
    expect(parseMinutes('1:60').error?.issues[0].message).toBe(
      'Informe as horas no formato hh:mm ou -hh:mm'
    )
  })
})
