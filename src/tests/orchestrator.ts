import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import retry from 'async-retry'

import { statusModel } from '@/models'

const execAsync = promisify(exec)

const waitForAllServices = async () => {
  await retry(async () => await statusModel.check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const clearDatabase = async () => await execAsync('pnpm db:reset --force')

const orchestrator = {
  waitForAllServices,
  clearDatabase
}

export default orchestrator
