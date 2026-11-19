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

const refineDocument = (
  data: { tipoDoc: number; cpfCnpj: string },
  context: z.RefinementCtx
): void => {
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
}

export const createSchema = schema.superRefine(refineDocument)

export const saveSchema = schema
  .extend({ id: z.uuid() })
  .superRefine(refineDocument)

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
