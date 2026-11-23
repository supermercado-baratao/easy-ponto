'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'

import type { TRemoveHolidayState } from './types'

export const removeHoliday = async (
  _state: TRemoveHolidayState,
  formData: FormData
): Promise<TRemoveHolidayState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await holidayModel.remove({ id: formData.get('id') as string, companyId })
    refresh()
    return null
  })
}
