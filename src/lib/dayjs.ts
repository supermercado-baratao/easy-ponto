import 'dayjs/locale/pt-br'

import _dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

_dayjs.extend(utc)

_dayjs.locale('pt-br')

export const dayjs = _dayjs.utc
