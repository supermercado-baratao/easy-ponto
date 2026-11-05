import { statusModel } from '@/models/status/model'

export const getOpenedConnections = async (): Promise<number> =>
  await statusModel.getOpenedConnections()
