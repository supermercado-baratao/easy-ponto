import { z } from 'zod'

import { schema } from './schema'

export type TDeviceCredentialsFormData = z.infer<typeof schema>

export type TDeviceCredentialsUpsertData = Omit<
  TDeviceCredentialsFormData,
  'id' | 'password'
> & {
  adminUserId: string
  password?: string
}
