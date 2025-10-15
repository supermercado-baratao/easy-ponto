export type TDatabaseStatus = {
  version: string
  max_connections: string
  opened_connections: number
}

export type TStatus = {
  updated_at: string
  dependencies: {
    database: TDatabaseStatus
  }
}
