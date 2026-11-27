import { z } from 'zod'

import { timeSchema, timeToMinutes } from '@/infra/time'

import {
  DAY_KINDS,
  getOvertimeBandFieldName,
  MAX_OVERTIME_PERCENTAGE,
  MAX_TOLERANCE,
  OVERTIME_BAND_INDEXES,
  type TDayKind
} from './utils'

const toleranceSchema = z.coerce
  .number({ error: 'Informe os minutos' })
  .int('Informe um número inteiro de minutos')
  .min(0, 'Informe zero ou mais minutos')
  .max(MAX_TOLERANCE, `Informe no máximo ${MAX_TOLERANCE} minutos`)

const durationSchema = timeSchema
  .refine((value) => value !== '', { message: 'Informe a duração' })
  .transform(timeToMinutes)
  .refine((minutes) => minutes > 0, {
    message: 'Informe uma duração maior que zero'
  })

export const journeyRulesSchema = z
  .object({
    companyId: z.uuidv4(),
    punchTolerance: toleranceSchema,
    dailyTolerance: toleranceSchema,
    maxLunch: durationSchema,
    maxDailyJourney: durationSchema,
    maxContinuousWork: durationSchema
  })
  .refine(
    ({ punchTolerance, dailyTolerance }) =>
      !toleranceSchema.safeParse(punchTolerance).success ||
      dailyTolerance >= punchTolerance,
    {
      path: ['dailyTolerance'],
      message: 'A tolerância do dia deve ser pelo menos a da batida'
    }
  )

const percentageSchema = z.coerce
  .number({ error: 'Informe o adicional' })
  .int('Informe um número inteiro')
  .min(1, 'Informe um adicional maior que zero')
  .max(MAX_OVERTIME_PERCENTAGE, `Informe no máximo ${MAX_OVERTIME_PERCENTAGE}%`)

type TBand = { dayKind: TDayKind; upTo: number | null; percentage: number }

type TBandIssue = { path: [string]; message: string }

const parseDayKind = (
  data: Record<string, unknown>,
  dayKind: TDayKind
): { bands: TBand[]; issues: TBandIssue[] } => {
  const fieldName = (index: number, field: 'upTo' | 'percentage'): string =>
    getOvertimeBandFieldName(dayKind, index, field)
  const indexes = OVERTIME_BAND_INDEXES.filter(
    (index) => data[fieldName(index, 'percentage')] !== undefined
  )
  if (indexes.length === 0) {
    return {
      bands: [],
      issues: [
        { path: [fieldName(1, 'percentage')], message: 'Informe o adicional' }
      ]
    }
  }

  const bands: TBand[] = []
  const issues: TBandIssue[] = []
  let previousUpTo = 0
  for (const [position, index] of indexes.entries()) {
    const percentage = percentageSchema.safeParse(
      data[fieldName(index, 'percentage')] || undefined
    )
    if (!percentage.success) {
      issues.push({
        path: [fieldName(index, 'percentage')],
        message: percentage.error.issues[0].message
      })
    }

    const isLast = position === indexes.length - 1
    let upTo: number | null = null
    if (!isLast) {
      const value = data[fieldName(index, 'upTo')] ?? ''
      const duration = durationSchema.safeParse(value)
      if (value === '') {
        issues.push({
          path: [fieldName(index, 'upTo')],
          message: 'Informe o limite da faixa'
        })
      } else if (!duration.success) {
        issues.push({
          path: [fieldName(index, 'upTo')],
          message: duration.error.issues[0].message
        })
      } else if (duration.data <= previousUpTo) {
        issues.push({
          path: [fieldName(index, 'upTo')],
          message: 'O limite deve ser maior que o da faixa anterior'
        })
      } else {
        upTo = duration.data
        previousUpTo = duration.data
      }
    }

    if (percentage.success) {
      bands.push({ dayKind, upTo, percentage: percentage.data })
    }
  }
  return { bands, issues }
}

export const overtimeBandsSchema = z
  .looseObject({ companyId: z.uuidv4() })
  .superRefine((data, context) => {
    for (const dayKind of DAY_KINDS) {
      for (const issue of parseDayKind(data, dayKind).issues) {
        context.addIssue({ code: 'custom', ...issue })
      }
    }
  })
  .transform((data) => ({
    companyId: data.companyId,
    overtimeBands: DAY_KINDS.flatMap(
      (dayKind) => parseDayKind(data, dayKind).bands
    )
  }))

export const companyIdSchema = z.uuidv4()
