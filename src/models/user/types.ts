import { z } from 'zod'

import { updateSchema } from './schema'

export type TUserUpdateData = z.input<typeof updateSchema>
