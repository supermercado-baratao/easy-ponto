import { statusModel } from '@/models/status/model'
import type { TStatusCheckData } from '@/models/status/types'

export const getStatus = async (): Promise<TStatusCheckData> =>
  await statusModel.check()
