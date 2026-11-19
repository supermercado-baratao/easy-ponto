import { isCPF } from 'validation-br'
import { z } from 'zod'

// better-auth's default minimum (`emailAndPassword.minPasswordLength`)
const MIN_PASSWORD_LENGTH = 8

export const passwordSchema = z
  .string('Informe a senha')
  .min(
    MIN_PASSWORD_LENGTH,
    `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
  )

export const setupSchema = z
  .object({
    companyName: z
      .string('Informe o nome da empresa')
      .trim()
      .min(1, 'Informe o nome da empresa'),
    name: z.string('Informe o seu nome').trim().min(1, 'Informe o seu nome'),
    email: z.email('Informe um e-mail válido').trim().toLowerCase(),
    password: passwordSchema,
    passwordConfirmation: z.string()
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem'
  })

export const emailSignInSchema = z.object({
  email: z.email('Informe um e-mail válido').trim().toLowerCase(),
  password: z.string().min(1, 'Informe a senha')
})

export const cpfSignInSchema = z.object({
  cpf: z.string().refine((value) => isCPF(value), { message: 'CPF inválido' }),
  password: z.string().min(1, 'Informe a senha')
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordSchema,
    passwordConfirmation: z.string()
  })
  .refine((data) => data.newPassword === data.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não conferem'
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual'
  })

export const resetEmployeePasswordSchema = z.object({
  companyId: z.uuid(),
  userId: z.uuid()
})
