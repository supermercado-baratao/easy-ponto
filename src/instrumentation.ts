export const register = async (): Promise<void> => {
  // `pnpm dev` and the tests run `drizzle-kit migrate` themselves
  if (
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.NODE_ENV !== 'production'
  )
    return

  const { migrateDatabase } = await import('@/infra/database/migrate')
  await migrateDatabase()
}
