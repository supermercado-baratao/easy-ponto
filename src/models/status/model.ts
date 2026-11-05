import { statusRepository } from '@/repositories/status-repository'

import { TStatusCheckData } from './types'

const getOpenedConnections = async (): Promise<number> =>
  await statusRepository.getOpenedConnections()

const check = async (): Promise<TStatusCheckData> => {
  const updatedAt = new Date()
  const [version, maxConnections] = await Promise.all([
    statusRepository.getDatabaseVersion(),
    statusRepository.getMaxConnections()
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
