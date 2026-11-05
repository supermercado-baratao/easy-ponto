import { beforeAll, describe, expect, test } from 'vitest'

import { statusModel } from '@/models/status/model'
import { TStatusCheckData } from '@/models/status/types'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

describe('Status Model', () => {
  describe('Anonymous user', () => {
    test('Retrieving current system status', async () => {
      const data = await statusModel.check()
      const expectedData: TStatusCheckData = {
        dependencies: {
          database: {
            version: expect.stringMatching(/^18\.\d+$/),
            maxConnections: '100',
            /**
            When the test is running, the number of opened connections is not predictable, so we use the data from the response
            Explanation: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management#disconnect
            */
            openedConnections: expect.any(Number)
          }
        },
        updatedAt: expect.any(Date)
      }

      expect(data).toEqual(expectedData)
    })
  })
})
