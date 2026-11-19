import { z } from 'zod'

import { addSchema, changeRoleSchema, memberActionSchema } from './schema'

export type TMember = {
  id: string
  userId: string
  role: string
  name: string
  email: string
}

export type TMemberActor = {
  userId: string
  role: string
}

export type TMemberAddData = z.input<typeof addSchema>

export type TMemberChangeRoleData = z.input<typeof changeRoleSchema>

export type TMemberActionData = z.input<typeof memberActionSchema>
