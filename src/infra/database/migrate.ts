import path from 'node:path'

import { migrate } from 'drizzle-orm/node-postgres/migrator'

import { database } from './client'

// Read from the working directory, since the Docker image copies the folder next to `server.js`
const migrationsFolder = path.join(
  process.cwd(),
  'src/infra/database/migrations'
)

export const migrateDatabase = async (): Promise<void> => {
  await migrate(database, { migrationsFolder })
}
