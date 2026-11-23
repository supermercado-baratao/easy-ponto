import { secullumAdapter } from './adapters/secullum/adapter'
import { formatSchema } from './schema'
import type {
  TTimeCardReport,
  TTimeCardReportAdapter,
  TTimeCardReportFormat
} from './types'

const ADAPTERS: Record<TTimeCardReportFormat, TTimeCardReportAdapter> = {
  secullum: secullumAdapter
}

const read = async (
  format: TTimeCardReportFormat,
  file: File
): Promise<TTimeCardReport> =>
  await ADAPTERS[formatSchema.parse(format)].read(file)

export const timeCardReportModel = {
  read
}
