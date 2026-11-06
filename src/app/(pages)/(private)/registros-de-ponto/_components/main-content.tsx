import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { TAdminUserWithRelations, User } from '@/infra/database/types'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'

import { PeriodFilter } from './period-filter/period-filter'
import { PunchRecordsTable } from './punch-records-table/punch-records-table'
import { SynchronizationButton } from './synchronization-button/synchronization-button'
import { UserHeader } from './user-header/user-header'

export const MainContent = ({
  adminUser,
  users,
  user,
  period,
  days
}: {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TPunchRecordDay[]
}) => (
  <>
    <Header title="Registros de Ponto">
      {adminUser.companyId && adminUser.deviceCredentials && (
        <SynchronizationButton
          companyId={adminUser.companyId}
          deviceCredentials={adminUser.deviceCredentials}
        />
      )}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {user ? (
        <>
          <UserHeader users={users} user={user} period={period} />
          <PeriodFilter pis={user.pis} period={period} />
          <PunchRecordsTable days={days} />
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhum funcionário encontrado
          </Typography>
          <Typography component="p" variant="base">
            Cadastre ou importe funcionários do dispositivo para começar
          </Typography>
        </div>
      )}
    </_MainContent>
  </>
)
