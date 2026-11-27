import type { UserGroup } from '@/infra/database/types'

export type TUserGroupRow = { group: UserGroup; members: number }
