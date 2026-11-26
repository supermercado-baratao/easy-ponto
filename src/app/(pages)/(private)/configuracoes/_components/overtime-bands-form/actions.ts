'use server'

import { refresh } from 'next/cache'

import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import { journeyRulesModel } from '@/models/journey-rules/model'

import type { TOvertimeBandsFormState } from './types'

export const save = async (
  state: TOvertimeBandsFormState,
  formData: FormData
): Promise<TOvertimeBandsFormState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as Record<string, string>
  formData.set('companyId', company.id)
  const result = await handleFormAction(
    journeyRulesModel.saveOvertimeBands,
    state,
    formData
  )
  if (result.success) {
    refresh()
    return { ...result, values: undefined }
  }
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { ...result, values }
}
