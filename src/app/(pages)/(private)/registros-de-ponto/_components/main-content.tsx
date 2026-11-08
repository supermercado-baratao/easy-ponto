import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type {
  TAdminUserWithRelations,
  TScheduleWithDays,
  User
} from '@/infra/database/types'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'

import { PeriodFilter } from './period-filter/period-filter'
import { PunchRecordsTable } from './punch-records-table/punch-records-table'
import { ScheduleSection } from './schedule/schedule-section'
import { SynchronizationButton } from './synchronization-button/synchronization-button'
import { UserHeader } from './user-header/user-header'

export const MainContent = ({
  adminUser,
  users,
  user,
  period,
  days,
  schedule,
  defaultScheduleStartDate
}: {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TPunchRecordDay[]
  schedule: TScheduleWithDays | null
  defaultScheduleStartDate: string
}) => (
  <>
    <Header title="Registros de Ponto">
      {adminUser.companyId && adminUser.deviceCredentials && (
        <SynchronizationButton />
      )}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {user ? (
        <>
          <UserHeader users={users} user={user} period={period} />
          <ScheduleSection
            user={user}
            schedule={schedule}
            defaultStartDate={defaultScheduleStartDate}
          />
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
