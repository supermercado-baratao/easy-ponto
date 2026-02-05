import retry from 'async-retry'

import { StatusModel } from '@/models'

const waitForAllServices = async () => {
  await retry(async () => await new StatusModel().check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const orchestrator = {
  waitForAllServices
}

export default orchestrator
