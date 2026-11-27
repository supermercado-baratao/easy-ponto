import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import type { User } from '@/infra/database/types'
import type { TScheduleDaySummary } from '@/models/journey/types'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

export type TAgendaDay = TScheduleDaySummary &
  Pick<TResolvedDay, 'date' | 'kind' | 'adjusted'>

export type TAgendaRow = {
  user: User
  shiftPatternNames: string[]
  days: TAgendaDay[] | null
}

export type TAgendaFilters = TUsersFilterValues & { time: string | null }
