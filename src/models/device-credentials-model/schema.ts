import { z } from 'zod'

export const schema = z.object({
  ip: z.ipv4(),
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  userId: z.uuid()
})

export type TDeviceCredentialsFormData = z.infer<typeof schema>
