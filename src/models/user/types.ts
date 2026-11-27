import type { z } from 'zod'

import type { JobFunction, User, UserGroup } from '@/infra/database/types'
import type { TUserJobFunctionLink } from '@/models/job-function/utils'

import type { updateSchema } from './schema'

export type TUserUpdateData = z.input<typeof updateSchema>

export type TUserWithOrganization = User & {
  groupIds: string[]
  jobFunctions: TUserJobFunctionLink[]
}

export type TUsersWithOrganization = {
  users: TUserWithOrganization[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
}
