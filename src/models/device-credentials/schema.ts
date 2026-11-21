import { z } from 'zod'

import { DEVICE_MODELS } from '@/models/device/utils'

export const schema = z.object({
  id: z.uuid().optional(),
  model: z.enum(DEVICE_MODELS, 'Modelo é obrigatório'),
  ip: z.ipv4(),
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string('Senha é obrigatória').min(1, 'Senha é obrigatória')
})
