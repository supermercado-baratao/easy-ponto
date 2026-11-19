'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'

import type { TRemoveHolidayState } from './types'

export const removeHoliday = async (
  state: TRemoveHolidayState,
  formData: FormData
): Promise<TRemoveHolidayState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  try {
    await holidayModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return { ...state, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
