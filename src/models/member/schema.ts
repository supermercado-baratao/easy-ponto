import { z } from 'zod'

import { passwordSchema } from '@/models/account/schema'
import { isEmployeeEmail } from '@/models/account/utils'

import { ASSIGNABLE_ROLES } from './utils'

const actorSchema = {
  companyId: z.uuid(),
  actorUserId: z.uuid(),
  actorRole: z.string()
}

const roleSchema = z
  .string('Selecione o papel')
  .pipe(z.enum(ASSIGNABLE_ROLES, 'Selecione o papel'))

export const addSchema = z.object({
  ...actorSchema,
  name: z.string('Informe o nome').trim().min(1, 'Informe o nome'),
  // The employees' accounts are created by the synchronization and managed in /funcionarios
  email: z
    .email('Informe um e-mail válido')
    .trim()
    .toLowerCase()
    .refine(
      (email) => !isEmployeeEmail(email),
      'Use o e-mail da pessoa, não o de funcionário'
    ),
  role: roleSchema,
  password: passwordSchema
})

export const memberActionSchema = z.object({
  ...actorSchema,
  id: z.uuid()
})

export const changeRoleSchema = memberActionSchema.extend({
  role: roleSchema
})
