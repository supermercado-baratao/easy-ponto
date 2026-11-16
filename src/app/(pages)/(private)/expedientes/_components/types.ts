import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import type { User } from '@/infra/database/types'
import type { TScheduleDaySummary } from '@/models/journey/types'
import type { TWeekdayKey } from '@/models/schedule/utils'

export type TAgendaDay = TScheduleDaySummary & { key: TWeekdayKey }

export type TAgendaRow = {
  user: User
  days: TAgendaDay[] | null
}

export type TAgendaFilters = TUsersFilterValues & { time: string | null }
