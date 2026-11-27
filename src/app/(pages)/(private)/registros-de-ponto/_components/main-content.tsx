import { Header } from '@/app/components/blocks/header'
import { PunchRecordsTable } from '@/app/components/blocks/punch-records-table'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type {
  JustificationType,
  TJustificationWithType,
  User
} from '@/infra/database/types'
import type { TJourneyDay } from '@/models/journey/types'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import { DayActionsMenu } from './justification/day-actions-menu'
import { JustificationProvider } from './justification/justification-provider'
import { PeriodFilter } from './period-filter/period-filter'
import { SynchronizationButton } from './synchronization-button/synchronization-button'
import { UserHeader } from './user-header/user-header'

export const MainContent = ({
  hasDevice,
  users,
  user,
  period,
  days,
  justifications,
  justificationTypes,
  overtimePercentages,
  canEdit
}: {
  hasDevice: boolean
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TJourneyDay[]
  justifications: TJustificationWithType[]
  justificationTypes: JustificationType[]
  overtimePercentages: number[]
  canEdit: boolean
}) => (
  <>
    <Header title="Registros de Ponto">
      {canEdit && hasDevice && <SynchronizationButton />}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {user ? (
        <>
          <UserHeader users={users} user={user} period={period} />
          <PeriodFilter pis={user.pis} period={period} />
          <JustificationProvider
            user={{ id: user.id, name: user.name }}
            types={justificationTypes}
          >
            <PunchRecordsTable
              days={days}
              justifications={justifications}
              overtimePercentages={overtimePercentages}
              renderActions={
                canEdit
                  ? (date, dayJustifications) => (
                      <DayActionsMenu
                        date={date}
                        justifications={dayJustifications}
                      />
                    )
                  : undefined
              }
            />
          </JustificationProvider>
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhum funcionário encontrado
          </Typography>
          {canEdit && (
            <Typography component="p" variant="base">
              Cadastre ou importe funcionários do dispositivo para começar
            </Typography>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
