import { z } from 'zod'

import { schema } from './schema'

export type TCompanyFormData = z.infer<typeof schema>
