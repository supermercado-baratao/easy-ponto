import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import retry from 'async-retry'

import {
  adminUserModel,
  deviceCredentialsModel,
  statusModel,
  synchronizationModel
} from '@/models'

const execAsync = promisify(exec)

const waitForAllServices = async () => {
  await retry(async () => await statusModel.check(), {
    retries: 60,
    maxTimeout: 1000,
    minTimeout: 100
  })
}

const clearDatabase = async () => await execAsync('pnpm db:reset --force')

const populateDatabase = async () => {
  const { id: adminUserId } = await adminUserModel.create()
  const credentials = await deviceCredentialsModel.upsert({
    adminUserId,
    ip: process.env.DEVICE_IP!,
    login: process.env.DEVICE_LOGIN!,
    password: process.env.DEVICE_PASSWORD!
  })
  await synchronizationModel.receive.company({
    adminUserId,
    credentials: {
      ...credentials,
      deviceCredentialsId: credentials.id
    }
  })
}

// await populateDatabase()

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  populateDatabase
}

export default orchestrator
