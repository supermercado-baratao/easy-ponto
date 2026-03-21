import { PunchRecord, User } from '@prisma/client'

export type TData = {
  users: User[]
  punchRecords: PunchRecord[]
}
