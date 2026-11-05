import { z } from 'zod'

import { schema } from './schema'

export type TDeviceCredentialsFormData = z.infer<typeof schema>
