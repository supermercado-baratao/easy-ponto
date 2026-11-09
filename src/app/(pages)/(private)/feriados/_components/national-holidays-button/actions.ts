'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { holidayModel } from '@/models/holiday/model'

import type { TNationalHolidaysState } from './types'

export const addNationalHolidays = async (
  state: TNationalHolidaysState,
  formData: FormData
): Promise<TNationalHolidaysState> => {
  try {
    const { id, companyId } = await getAdminUser()
    if (!companyId) throw new Error(`AdminUser ${id} has no company`)
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
