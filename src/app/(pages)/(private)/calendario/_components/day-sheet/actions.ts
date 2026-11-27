'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'

import type { TDayFormState, TDayFormValues } from './types'

export const save = async (
  state: TDayFormState,
  formData: FormData
): Promise<TDayFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TDayFormValues
  const adjustmentId = formData.get('adjustmentId')
  if (values.kind === 'schedule') {
    // The day already follows the schedule without an adjustment, so there is nothing to save
    if (typeof adjustmentId !== 'string' || !adjustmentId) {
      return { success: true, changed: false }
    }
    const { success, fatalError, message, action } = await handleAction(
      async () => {
        await shiftAssignmentModel.removeAdjustment({
          id: adjustmentId,
          companyId: company.id
        })
        return null
      }
    )
    if (success) refresh()
    return { success, fatalError, message, action, changed: success }
  }

  formData.set('companyId', company.id)
  const { success, errors, fatalError, message, action } =
    await handleFormAction(shiftAssignmentModel.saveAdjustment, state, formData)
  if (success) refresh()
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return {
    success,
    errors,
    fatalError,
    message,
    action,
    values: success ? undefined : values,
    changed: success
  }
}
