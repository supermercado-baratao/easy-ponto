import 'dayjs/locale/pt-br.js'

import _dayjs, { type Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

_dayjs.extend(utc)
_dayjs.extend(timezone)

_dayjs.locale('pt-br')

const STORE_TIME_ZONE = 'America/Sao_Paulo'

export const dayjs = _dayjs.utc

// Dates are stored as UTC wall-clock values, so "now" must be the store's local time read as UTC,
// not the UTC instant, which is already the next day after 21:00 in São Paulo
export const wallClockNow = (): Dayjs =>
  dayjs(_dayjs().tz(STORE_TIME_ZONE).format('YYYY-MM-DDTHH:mm:ss.SSS'))
