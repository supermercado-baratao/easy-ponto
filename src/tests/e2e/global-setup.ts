import orchestrator from '@/tests/orchestrator'

const globalSetup = async (): Promise<void> => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  await orchestrator.populateDatabaseWithMockedData()
}

export default globalSetup
