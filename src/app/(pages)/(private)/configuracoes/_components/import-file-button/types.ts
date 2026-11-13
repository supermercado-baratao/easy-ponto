import type { Company } from '@/infra/database/types'
import type { TFileImportResult } from '@/models/synchronization/types'

type TUnresolvedImport = Extract<TFileImportResult, { status: 'unresolved' }>

export type TImportFileState = {
  data?: Company
  success?: boolean
  fatalError?: boolean
  message?: string
  action?: string
  unknownCodes?: TUnresolvedImport['unknownCodes']
  types?: TUnresolvedImport['types']
  errors?: Record<string, string>
  skippedJustifications?: number
}
