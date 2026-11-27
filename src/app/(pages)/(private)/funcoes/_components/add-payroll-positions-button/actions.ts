'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { jobFunctionModel } from '@/models/job-function/model'

import type { TAddPayrollPositionsState } from './types'

export const addPayrollPositions =
  async (): Promise<TAddPayrollPositionsState> => {
    const {
      company: { id: companyId }
    } = await requireEditor()
    return await handleAction(async () => {
      const created =
        await jobFunctionModel.createFromPayrollPositions(companyId)
      refresh()
      return created.length
    })
  }
