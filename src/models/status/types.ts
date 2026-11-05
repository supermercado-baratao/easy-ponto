export type TStatusDatabase = {
  version: string
  maxConnections: string
  openedConnections: number
}

export type TStatusCheckData = {
  updatedAt: Date
  dependencies: {
    database: TStatusDatabase
  }
}
