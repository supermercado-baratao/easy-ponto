import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { requireCompany } from '@/entry/session'
import { filterUsers, getPositions } from '@/models/user/utils'
import { workloadCalendarModel } from '@/models/workload-calendar/model'

import type {
  TCalendarFilters,
  TCalendarRow,
  TCalendarUserMonthView
} from './_components/types'

type TCalendarPageData = {
  month: string
  rows: TCalendarRow[]
  selected: TCalendarUserMonthView | null
  total: number
  positions: string[]
  filters: TCalendarFilters
  canEdit: boolean
}

export const getCalendarPageData = async (searchParameters: {
  month?: string
  userId?: string
  name?: string
  position?: string
  status?: string
}): Promise<TCalendarPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const month = workloadCalendarModel.resolveMonth(searchParameters.month)
  const { users, summaries, selected } = await workloadCalendarModel.findMonth({
    companyId,
    month,
    userId: searchParameters.userId
  })
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  const rows = filterUsers(users, {
    name,
    position: position ?? undefined,
    status
  }).map((user) => ({
    user,
    summary: summaries.find(({ userId }) => userId === user.id)!
  }))
  return {
    month,
    rows,
    selected: selected && {
      user: selected.user,
      weeks: selected.weeks,
      summary: selected.summary,
      assignments: selected.assignments.map(
        ({ id, startDate, endDate, shiftPattern }) => ({
          id,
          startDate,
          endDate,
          name: shiftPattern.name
        })
      )
    },
    total: users.length,
    positions: getPositions(users),
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null,
      userId: selected?.user.id ?? null
    },
    canEdit
  }
}
