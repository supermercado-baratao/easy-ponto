'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { restRuleModel } from '@/models/rest-rule/model'

import type { TRestRuleFormState, TRestRuleFormValues } from './types'

const getValues = (formData: FormData): TRestRuleFormValues => ({
  ...(Object.fromEntries(
    [...formData].filter(([key]) => !key.endsWith('[]'))
  ) as Omit<TRestRuleFormValues, 'shiftPatternIds' | 'blockedWeekdays'>),
  shiftPatternIds: formData.getAll('shiftPatternIds[]') as string[],
  blockedWeekdays: formData.getAll('blockedWeekdays[]') as string[]
})

export const save = async (
  state: TRestRuleFormState,
  formData: FormData
): Promise<TRestRuleFormState> => {
  const { company } = await requireEditor()
  const values = getValues(formData)
  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } = formData.get('id')
    ? await handleFormAction(restRuleModel.update, state, formData)
    : await handleFormAction(restRuleModel.create, state, formData)
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
