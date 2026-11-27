'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'

import type { TNationalHolidaysState } from './types'

export const addNationalHolidays =
  async (): Promise<TNationalHolidaysState> => {
    const {
      company: { id: companyId }
    } = await requireEditor()
    return await handleAction(async () => {
      const data = await holidayModel.addNationalHolidays(companyId)
      refresh()
      return data
    })
  }
