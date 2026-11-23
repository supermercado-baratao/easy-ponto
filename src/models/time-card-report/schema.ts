import { z } from 'zod'

import { TIME_CARD_REPORT_FORMATS } from './utils'

export const formatSchema = z.enum(TIME_CARD_REPORT_FORMATS, {
  error: 'Selecione o sistema de origem'
})
