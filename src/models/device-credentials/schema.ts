import { z } from 'zod'

export const schema = z.object({
  id: z.uuid().optional(),
  ip: z.ipv4(),
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  adminUserId: z.uuid()
})
