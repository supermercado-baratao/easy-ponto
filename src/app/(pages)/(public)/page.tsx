import prisma from '@/infra/prisma'

const getOpenedConnections = async (): Promise<number> => {
  const databaseName = process.env.POSTGRES_DB as string
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::int FROM pg_stat_activity WHERE datname = ${databaseName};
  `
  return Number(result[0].count)
}

const LandingPage = async () => {
  const openedConnections = await getOpenedConnections()
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="font-bold text-2xl">Landing Page</h1>
      <p className="mt-2 text-gray-500 text-sm">
        Conexões abertas: {openedConnections}
      </p>
    </div>
  )
}

export default LandingPage
