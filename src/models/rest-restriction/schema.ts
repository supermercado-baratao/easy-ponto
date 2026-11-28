import { z } from 'zod'

import { REST_CONSTRAINT_LEVELS } from '@/models/rest-rule/utils'

import { REST_RESTRICTION_KINDS } from './utils'

const optionalIdSchema = z
  .union([z.literal(''), z.uuidv4()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const maxOffSchema = z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.coerce
    .number({ error: 'Informe o máximo de folga no mesmo dia' })
    .int('Informe o máximo de folga no mesmo dia')
    .min(1, 'Informe um máximo de pelo menos 1')
    .optional()
)

const dataShape = {
  companyId: z.uuidv4(),
  kind: z.enum(REST_RESTRICTION_KINDS, {
    error: 'Selecione o tipo da restrição'
  }),
  level: z.enum(REST_CONSTRAINT_LEVELS, { error: 'Selecione o nível' }),
  maxOff: maxOffSchema,
  userIds: z
    .array(z.uuidv4())
    .default([])
    .transform((ids) => [...new Set(ids)]),
  userGroupId: optionalIdSchema,
  userId: optionalIdSchema,
  weekdays: z
    .array(z.coerce.number().int().min(0).max(6))
    .default([])
    .transform((weekdays) => [...new Set(weekdays)].toSorted((a, b) => a - b))
}

type TParsedData = z.infer<z.ZodObject<typeof dataShape>>

const addIssue = (
  context: z.RefinementCtx,
  path: keyof TParsedData,
  message: string
): void => {
  context.addIssue({ code: 'custom', path: [path], message })
}

const refineData = (data: TParsedData, context: z.RefinementCtx): void => {
  switch (data.kind) {
    case 'together': {
      if (data.userIds.length < 2) {
        addIssue(context, 'userIds', 'Selecione ao menos dois funcionários')
      }
      if (data.maxOff === undefined) {
        addIssue(context, 'maxOff', 'Informe o máximo de folga no mesmo dia')
      } else if (
        data.userIds.length >= 2 &&
        data.maxOff >= data.userIds.length
      ) {
        addIssue(
          context,
          'maxOff',
          'Informe um máximo menor que o número de funcionários'
        )
      }
      return
    }
    case 'group': {
      if (!data.userGroupId)
        addIssue(context, 'userGroupId', 'Selecione o grupo')
      if (data.maxOff === undefined) {
        addIssue(context, 'maxOff', 'Informe o máximo de folga no mesmo dia')
      }
      return
    }
    case 'weekdays': {
      if (!data.userId) addIssue(context, 'userId', 'Selecione o funcionário')
      if (data.weekdays.length === 0) {
        addIssue(context, 'weekdays', 'Selecione os dias da semana proibidos')
      } else if (data.weekdays.length === 7) {
        addIssue(context, 'weekdays', 'Deixe ao menos um dia da semana livre')
      }
    }
  }
}

// Only the fields of the kind are saved, so changing the kind leaves nothing of the previous one behind
const toRestrictionData = ({
  companyId,
  kind,
  level,
  maxOff,
  userIds,
  userGroupId,
  userId,
  weekdays
}: TParsedData): {
  companyId: string
  kind: TParsedData['kind']
  level: TParsedData['level']
  maxOff: number | null
  userIds: string[]
  userGroupId: string | null
  userId: string | null
  weekdays: number[]
} => ({
  companyId,
  kind,
  level,
  maxOff: kind === 'weekdays' ? null : maxOff!,
  userIds: kind === 'together' ? userIds : [],
  userGroupId: kind === 'group' ? userGroupId : null,
  userId: kind === 'weekdays' ? userId : null,
  weekdays: kind === 'weekdays' ? weekdays : []
})

export const createSchema = z
  .object(dataShape)
  .superRefine(refineData)
  .transform(toRestrictionData)

export const updateSchema = z
  .object({ id: z.uuidv4(), ...dataShape })
  .superRefine(refineData)
  .transform((data) => ({ id: data.id, ...toRestrictionData(data) }))

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const companyIdSchema = z.uuidv4()
