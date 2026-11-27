import type { JobFunction } from '@/infra/database/types'

export type TJobFunctionRow = {
  jobFunction: JobFunction
  active: number
  inactive: number
}
