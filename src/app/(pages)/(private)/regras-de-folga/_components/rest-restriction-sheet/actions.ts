'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { restRestrictionModel } from '@/models/rest-restriction/model'

import type {
  TRestRestrictionFormState,
  TRestRestrictionFormValues
} from './types'

const getValues = (formData: FormData): TRestRestrictionFormValues => ({
  ...(Object.fromEntries(
    [...formData].filter(([key]) => !key.endsWith('[]'))
  ) as Omit<TRestRestrictionFormValues, 'userIds' | 'weekdays'>),
  userIds: formData.getAll('userIds[]') as string[],
  weekdays: formData.getAll('weekdays[]') as string[]
})

export const save = async (
  state: TRestRestrictionFormState,
  formData: FormData
): Promise<TRestRestrictionFormState> => {
  const { company } = await requireEditor()
  const values = getValues(formData)
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(restRestrictionModel.update, state, formData)
    : await handleFormAction(restRestrictionModel.create, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return {
    success,
    errors,
    fatalError,
    message,
    action,
    values: success ? undefined : values
  }
}
