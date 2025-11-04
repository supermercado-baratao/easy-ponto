import retry from 'async-retry'

import { API_BASE_URL } from '@/shared/constants/base-url'

const waitForAllServices = async () => {
  await retry(
    async () => {
      const response = await fetch(`${API_BASE_URL}/status`)
      if (!response.ok) {
        throw new Error('Service not ready')
      }
    },
    {
      retries: 60,
      maxTimeout: 1000,
      minTimeout: 100
    }
  )
}

const orchestrator = {
  waitForAllServices
}

export default orchestrator
