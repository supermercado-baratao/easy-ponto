import 'dayjs/locale/pt-br'

import dayjs from 'dayjs'

dayjs.locale('pt-br')

export const formatDatetime = (datetime: string) => {
  return dayjs(datetime).format('DD [de] MMMM [de] YYYY [às] HH:mm:ss')
}
