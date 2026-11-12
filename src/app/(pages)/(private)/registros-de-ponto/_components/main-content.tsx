import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type {
  JustificationType,
  TAdminUserWithRelations,
  TJustificationWithType,
  TScheduleWithDays,
  User
} from '@/infra/database/types'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'

import { JustificationProvider } from './justification/justification-provider'
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
  defaultScheduleStartDate,
  justifications,
  justificationTypes
}: {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TPunchRecordDay[]
  schedule: TScheduleWithDays | null
  defaultScheduleStartDate: string
  justifications: TJustificationWithType[]
  justificationTypes: JustificationType[]
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
          <JustificationProvider
            user={{ id: user.id, name: user.name }}
            types={justificationTypes}
          >
            <PunchRecordsTable days={days} justifications={justifications} />
          </JustificationProvider>
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
