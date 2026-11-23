import type { TReportImportState } from '@/app/components/blocks/report-import-form'
import type { Company } from '@/infra/database/types'

export type TImportFileState = TReportImportState & {
  data?: Company
  skippedJustifications?: number
}
