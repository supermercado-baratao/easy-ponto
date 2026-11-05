import type {
  AdminUser,
  Company,
  DeviceCredentials,
  User
} from '@/infra/database/types'

export type TAdminUserWithRelations = AdminUser & {
  company: Company | null
  deviceCredentials: DeviceCredentials | null
  user: User | null
}
