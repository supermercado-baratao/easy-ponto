import { connection } from 'next/server'

import { statusModel } from '@/models/status/model'

export const getOpenedConnections = async (): Promise<number> => {
  await connection()
  return await statusModel.getOpenedConnections()
}
