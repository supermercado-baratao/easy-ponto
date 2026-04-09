import 'dayjs/locale/pt-br.js'

import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

_dayjs.extend(utc)

_dayjs.locale('pt-br')

export const dayjs = _dayjs.utc
