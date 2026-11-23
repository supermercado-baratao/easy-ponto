import { describe, expect, test } from 'vitest'
import { ZodError } from 'zod'

import { timeCardReportModel } from './model'
import type { TTimeCardReportFormat } from './types'

describe('Time Card Report Model', () => {
  describe('read', () => {
    test('Refuses a format without an adapter', async () => {
      await expect(
        timeCardReportModel.read(
          'unknown' as TTimeCardReportFormat,
          new File([], 'report.xls')
        )
      ).rejects.toBeInstanceOf(ZodError)
    })
  })
})
