'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { scheduleModel } from '@/models/schedule/model'

import type { TScheduleFormState, TScheduleFormValues } from './types'

export const save = async (
  state: TScheduleFormState,
  formData: FormData
): Promise<TScheduleFormState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as TScheduleFormValues
  formData.set('companyId', adminUser.companyId ?? '')
  const { success, errors, fatalError } = await handleFormAction(
    scheduleModel.save,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
