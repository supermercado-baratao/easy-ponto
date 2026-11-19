import { z } from 'zod'

import {
  changePasswordSchema,
  cpfSignInSchema,
  emailSignInSchema,
  resetEmployeePasswordSchema,
  setupSchema
} from './schema'

export type TAccountSetupData = z.input<typeof setupSchema>

export type TEmailSignInData = z.input<typeof emailSignInSchema>

export type TCpfSignInData = z.input<typeof cpfSignInSchema>

export type TChangePasswordData = z.input<typeof changePasswordSchema>

export type TResetEmployeePasswordData = z.input<
  typeof resetEmployeePasswordSchema
>

export type TSignInCredentials = {
  email: string
  password: string
}
