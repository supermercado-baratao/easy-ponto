'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { handleFormAction } from '@/entry/form-action'
import { vacationPlanModel } from '@/models/vacation-plan/model'

import type { TPlanFormState, TPlanFormValues } from './types'

export const save = async (
  state: TPlanFormState,
  formData: FormData
): Promise<TPlanFormState> => {
  const adminUser = await getAdminUser()
  const values = Object.fromEntries(formData) as TPlanFormValues
  formData.set('companyId', adminUser.companyId ?? '')
  const { success, errors, fatalError } = await handleFormAction(
    vacationPlanModel.save,
    state,
    formData
  )
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { success, errors, fatalError, values: success ? undefined : values }
}
