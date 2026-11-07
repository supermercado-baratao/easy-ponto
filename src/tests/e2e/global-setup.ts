import orchestrator from '@/tests/orchestrator'

const globalSetup = async (): Promise<void> => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.populateDatabaseWithMockedData({
    adminUserId: process.env.ADMIN_USER_ID
  })
}

export default globalSetup
