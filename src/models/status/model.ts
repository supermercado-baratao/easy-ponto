import { statusRepo } from '@/repositories/status-repo'

import { TStatusCheckData } from './types'

const getOpenedConnections = async (): Promise<number> =>
  await statusRepo.getOpenedConnections()

const check = async (): Promise<TStatusCheckData> => {
  const updatedAt = new Date()
  const [version, maxConnections] = await Promise.all([
    statusRepo.getDatabaseVersion(),
    statusRepo.getMaxConnections()
  ])
  const count = await getOpenedConnections()
  return {
    updatedAt,
    dependencies: {
      database: {
        version,
        maxConnections,
        openedConnections: count
      }
    }
  }
}

export const statusModel = {
  check,
  getOpenedConnections
}
