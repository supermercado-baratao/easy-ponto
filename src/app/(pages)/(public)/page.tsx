import { db } from '@/infra/database/client'

const getOpenedConnections = async (): Promise<number> => {
  const databaseName = process.env.POSTGRES_DB as string
  const plan = db.raw.sql`
    SELECT COUNT(*)::int AS count FROM pg_stat_activity WHERE datname = ${databaseName}
  `
    .returnsRow({ count: 'pg/int4@1' })
    .build()
  const [row] = await db.query(plan)
  return row.count
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
