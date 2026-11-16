import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { getAdminUser } from '@/entry/admin-user'
import { wallClockNow } from '@/infra/dayjs'
import { scheduleModel } from '@/models/schedule/model'
import { timeSchema } from '@/models/schedule/schema'
import { hasEntryOrExitAt, timeToMinutes } from '@/models/schedule/utils'
import { filterUsers, getPositions } from '@/models/user/utils'

import type { TAgendaFilters, TAgendaRow } from './_components/types'
import { buildAgendaRow } from './_components/utils'

type TAgendaPageData = {
  hasCompany: boolean
  rows: TAgendaRow[]
  total: number
  positions: string[]
  filters: TAgendaFilters
}

export const getAgendaPageData = async (searchParameters: {
  name?: string
  position?: string
  status?: string
  time?: string
}): Promise<TAgendaPageData> => {
  const { companyId } = await getAdminUser()
  const userSchedules = companyId
    ? await scheduleModel.findManyInEffectByCompanyId({
        companyId,
        date: wallClockNow().format('YYYY-MM-DD')
      })
    : []
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  const time = timeSchema.safeParse(searchParameters.time?.trim()).data || null
  const users = filterUsers(
    userSchedules.map(({ user }) => user),
    { name, position: position ?? undefined, status }
  )
  return {
    hasCompany: !!companyId,
    rows: userSchedules
      .filter(
        ({ user, schedule }) =>
          users.includes(user) &&
          (!time || hasEntryOrExitAt(schedule, timeToMinutes(time)))
      )
      .map((userSchedule) => buildAgendaRow(userSchedule)),
    total: userSchedules.length,
    positions: getPositions(userSchedules.map(({ user }) => user)),
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null,
      time
    }
  }
}
