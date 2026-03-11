import retry from 'async-retry'

import { statusModel } from '@/models'

const waitForAllServices = async () => {
  await retry(async () => await statusModel.check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const orchestrator = {
  waitForAllServices
}

export default orchestrator
