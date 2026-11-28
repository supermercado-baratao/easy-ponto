import { z } from 'zod'

import { MAX_YEAR, MIN_YEAR } from '@/constants/year'

import {
  HOLIDAY_REST_POLICIES,
  MAX_REST_DISTANCE,
  MAX_WINDOW_DAY,
  REST_CONSTRAINT_FIELD_NAMES,
  REST_CONSTRAINT_LEVELS,
  REST_CONSTRAINTS,
  type TRestConstraint,
  type TRestConstraintField,
  type TRestConstraintLevel
} from './utils'

const windowDaySchema = (label: string): ReturnType<typeof z.coerce.number> =>
  z.coerce
    .number({ error: `Informe o ${label}` })
    .int(`Informe o ${label}`)
    .min(1, `Informe um dia de 1 a ${MAX_WINDOW_DAY}`)
    .max(MAX_WINDOW_DAY, `Informe um dia de 1 a ${MAX_WINDOW_DAY}`)

const distancesSchema = z
  .union([z.string(), z.array(z.number())])
  .transform((value, context) => {
    const parts = Array.isArray(value)
      ? value.map(String)
      : value.split(/[\s,;]+/).filter(Boolean)
    const distances = parts.map(Number)
    if (distances.length === 0) {
      context.addIssue({ code: 'custom', message: 'Informe as distâncias' })
      return z.NEVER
    }
    if (
      distances.some(
        (distance) =>
          !Number.isSafeInteger(distance) ||
          distance < 1 ||
          distance > MAX_REST_DISTANCE
      )
    ) {
      context.addIssue({
        code: 'custom',
        message: `Informe distâncias de 1 a ${MAX_REST_DISTANCE} dias, separadas por vírgula`
      })
      return z.NEVER
    }
    if (new Set(distances).size !== distances.length) {
      context.addIssue({
        code: 'custom',
        message: 'Informe cada distância uma vez só'
      })
      return z.NEVER
    }
    return distances
  })

const idsSchema = z
  .array(z.uuidv4())
  .default([])
  .transform((ids) => [...new Set(ids)])

const weekdaysSchema = z
  .array(z.coerce.number().int().min(0).max(6))
  .default([])
  .transform((weekdays) => [...new Set(weekdays)].toSorted((a, b) => a - b))

const levelSchema = z
  .union([z.literal(''), z.enum(REST_CONSTRAINT_LEVELS)])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const positionSchema = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce
    .number({ error: 'Informe a ordem' })
    .int('Informe a ordem')
    .min(1, `Informe uma ordem de 1 a ${REST_CONSTRAINTS.length}`)
    .max(
      REST_CONSTRAINTS.length,
      `Informe uma ordem de 1 a ${REST_CONSTRAINTS.length}`
    )
    .optional()
)

const constraintsShape = {
  sameMonthLevel: levelSchema,
  sameMonthPosition: positionSchema,
  blockedWeekdaysLevel: levelSchema,
  blockedWeekdaysPosition: positionSchema,
  noHolidayLevel: levelSchema,
  noHolidayPosition: positionSchema,
  sameLoadLevel: levelSchema,
  sameLoadPosition: positionSchema
} satisfies Record<TRestConstraintField, z.ZodType>

type TConstraintFields = Record<
  string,
  TRestConstraintLevel | number | null | undefined
>

const getConstraintFields = (
  data: TConstraintFields,
  constraint: TRestConstraint
): { level: TRestConstraintLevel | null; position: number | undefined } => {
  const name = REST_CONSTRAINT_FIELD_NAMES[constraint]
  return {
    level: data[`${name}Level`] as TRestConstraintLevel | null,
    position: data[`${name}Position`] as number | undefined
  }
}

const dataShape = {
  companyId: z.uuidv4(),
  name: z.string().trim().min(1, 'Informe o nome'),
  shiftPatternIds: idsSchema,
  windowStartDay: windowDaySchema('primeiro dia'),
  windowEndDay: windowDaySchema('último dia'),
  distances: distancesSchema,
  holidayRest: z.enum(HOLIDAY_REST_POLICIES, {
    error: 'Selecione o que vale para o feriado'
  }),
  blockedWeekdays: weekdaysSchema,
  ...constraintsShape
}

type TParsedData = z.infer<z.ZodObject<typeof dataShape>>

const refineData = (data: TParsedData, context: z.RefinementCtx): void => {
  if (data.shiftPatternIds.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['shiftPatternIds'],
      message: 'Selecione ao menos uma escala'
    })
  }
  if (data.windowEndDay < data.windowStartDay) {
    context.addIssue({
      code: 'custom',
      path: ['windowEndDay'],
      message: 'O último dia deve ser depois do primeiro'
    })
  }
  const fields = data as unknown as TConstraintFields
  const positions = new Set<number>()
  for (const constraint of REST_CONSTRAINTS) {
    const { level, position } = getConstraintFields(fields, constraint)
    if (level !== 'preferred') continue
    const path = [`${REST_CONSTRAINT_FIELD_NAMES[constraint]}Position`]
    if (position === undefined) {
      context.addIssue({ code: 'custom', path, message: 'Informe a ordem' })
    } else if (positions.has(position)) {
      context.addIssue({
        code: 'custom',
        path,
        message: 'Outra restrição preferencial já tem essa ordem'
      })
    } else {
      positions.add(position)
    }
  }
  const { level } = getConstraintFields(fields, 'blocked-weekdays')
  if (level && data.blockedWeekdays.length === 0) {
    context.addIssue({
      code: 'custom',
      path: ['blockedWeekdays'],
      message: 'Selecione os dias da semana bloqueados'
    })
  }
  if (level && data.blockedWeekdays.length === 7) {
    context.addIssue({
      code: 'custom',
      path: ['blockedWeekdays'],
      message: 'Deixe ao menos um dia da semana livre'
    })
  }
}

type TRuleConstraint = {
  constraint: TRestConstraint
  level: TRestConstraintLevel
  position: number | null
}

type TRuleData = Pick<
  TParsedData,
  | 'companyId'
  | 'name'
  | 'shiftPatternIds'
  | 'windowStartDay'
  | 'windowEndDay'
  | 'distances'
  | 'holidayRest'
  | 'blockedWeekdays'
> & { constraints: TRuleConstraint[] }

const toRuleData = (data: TParsedData): TRuleData => {
  const fields = data as unknown as TConstraintFields
  const constraints = REST_CONSTRAINTS.map((constraint) => ({
    constraint,
    ...getConstraintFields(fields, constraint)
  }))
    .filter(
      (entry): entry is typeof entry & { level: TRestConstraintLevel } =>
        entry.level !== null
    )
    .map(({ constraint, level, position }) => ({
      constraint,
      level,
      position: level === 'preferred' ? position! : null
    }))
  const blocksWeekdays = constraints.some(
    ({ constraint }) => constraint === 'blocked-weekdays'
  )
  return {
    companyId: data.companyId,
    name: data.name,
    shiftPatternIds: data.shiftPatternIds,
    windowStartDay: data.windowStartDay,
    windowEndDay: data.windowEndDay,
    distances: data.distances,
    holidayRest: data.holidayRest,
    blockedWeekdays: blocksWeekdays ? data.blockedWeekdays : [],
    constraints
  }
}

export const createSchema = z
  .object(dataShape)
  .superRefine(refineData)
  .transform(toRuleData)

export const updateSchema = z
  .object({ id: z.uuidv4(), ...dataShape })
  .superRefine(refineData)
  .transform((data) => ({ id: data.id, ...toRuleData(data) }))

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const companyIdSchema = z.uuidv4()

export const periodSchema = z.object({
  companyId: z.uuidv4(),
  month: z
    .string({ error: 'Informe o mês' })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Informe o mês')
    .refine((month) => {
      const year = Number(month.slice(0, 4))
      return year >= MIN_YEAR && year <= MAX_YEAR
    }, `Informe um mês de ${MIN_YEAR} a ${MAX_YEAR}`)
})
