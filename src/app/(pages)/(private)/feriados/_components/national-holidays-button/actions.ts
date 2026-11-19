'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'

import type { TNationalHolidaysState } from './types'

export const addNationalHolidays = async (
  state: TNationalHolidaysState,
  formData: FormData
): Promise<TNationalHolidaysState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  try {
    const data = await holidayModel.addNationalHolidays({
      companyId,
      year: formData.get('year') as string
    })
    refresh()
    return { ...state, data, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, data: null, success: false, fatalError: true }
  }
}
