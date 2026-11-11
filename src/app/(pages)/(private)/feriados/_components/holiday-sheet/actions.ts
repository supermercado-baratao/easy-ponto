'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { holidayModel } from '@/models/holiday/model'

import type { THolidayFormState, THolidayFormValues } from './types'

export const save = async (
  state: THolidayFormState,
  formData: FormData
): Promise<THolidayFormState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as THolidayFormValues
  formData.set('companyId', adminUser.companyId ?? '')
  const { success, errors, fatalError } = formData.get('id')
    ? await handleFormAction(holidayModel.update, state, formData)
    : await handleFormAction(holidayModel.create, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
