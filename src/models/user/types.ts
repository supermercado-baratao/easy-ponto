import type { PunchRecord, User } from '@/infra/database/types'

export type TUserWithPunchRecords = User & {
  punchRecords: PunchRecord[]
}
