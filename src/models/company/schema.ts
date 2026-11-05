import { isCNPJ, isCPF } from 'validation-br'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(255),
  cpf: z.string().refine((value) => isCPF(value), { message: 'CPF inválido' }),
  tipoDoc: z.preprocess(String, z.enum(['0', '1']).transform(Number)),
  cpfCnpj: z.string(),
  cei: z.string(),
  registration: z.string().nullable().optional()
})

export const upsertSchema = schema.superRefine((data, context) => {
  if (data.tipoDoc === 0 && !isCPF(data.cpfCnpj)) {
    context.addIssue({
      code: 'invalid_value',
      values: [data.cpfCnpj],
      path: ['cpfCnpj'],
      message: 'CPF inválido'
    })
  }

  if (data.tipoDoc === 1 && !isCNPJ(data.cpfCnpj)) {
    context.addIssue({
      code: 'invalid_value',
      values: [data.cpfCnpj],
      path: ['cpfCnpj'],
      message: 'CNPJ inválido'
    })
  }
})

export const updateSchema = schema
  .partial()
  .extend({
    id: z.uuid()
  })
  .superRefine((data, context) => {
    if (data.tipoDoc === 0) {
      if (!data.cpfCnpj || !isCPF(data.cpfCnpj)) {
        context.addIssue({
          code: 'invalid_value',
          values: [data.cpfCnpj],
          path: ['cpfCnpj'],
          message: 'CPF inválido'
        })
      }
      return
    }

    if (data.tipoDoc === 1 && (!data.cpfCnpj || !isCNPJ(data.cpfCnpj))) {
      context.addIssue({
        code: 'invalid_value',
        values: [data.cpfCnpj],
        path: ['cpfCnpj'],
        message: 'CNPJ inválido'
      })
    }
  })
