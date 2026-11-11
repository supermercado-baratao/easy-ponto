'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { holidayModel } from '@/models/holiday/model'

import type { TRemoveHolidayState } from './types'

export const removeHoliday = async (
  state: TRemoveHolidayState,
  formData: FormData
): Promise<TRemoveHolidayState> => {
  try {
    const { id, companyId } = await getAdminUser()
    if (!companyId) throw new Error(`AdminUser ${id} has no company`)
    await holidayModel.remove({
      id: formData.get('id') as string,
      companyId: companyId ?? ''
    })
    refresh()
    return { ...state, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
