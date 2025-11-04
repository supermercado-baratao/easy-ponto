import { beforeAll, describe, expect, test } from 'vitest'

import { API_BASE_URL } from '@/shared/constants/base-url'
import { TStatus } from '@/shared/types/status'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe('GET to /api/v1/status', () => {
  describe('Anonymous user', () => {
    test('Retrieving current system status', async () => {
      const response = await fetch(`${API_BASE_URL}/status`)
      expect(response.status).toBe(200)

      const data: TStatus = await response.json()
      const { updated_at } = data

      const parsedUpdatedAt = new Date(updated_at).toISOString()
      expect(updated_at).toBe(parsedUpdatedAt)

      const expectedData: TStatus = {
        updated_at,
        dependencies: {
          database: {
            version: '16.0',
            max_connections: '100',
            /**
             * When the test is running, the number of opened connections is not predictable, so we use the data from the response
             * Explanation: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management#disconnect
             */
            opened_connections: data.dependencies.database.opened_connections
          }
        }
      }

      expect(data).toEqual(expectedData)
    })
  })
})
