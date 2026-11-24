'use server'

import { refresh } from 'next/cache'

import { handleAction, type TActionState } from '@/entry/action'
import { handleFormAction } from '@/entry/form-action'
import { requireEditor } from '@/entry/session'
import type { Company } from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import type {
  TCompanyChange,
  TDeviceCompanyField
} from '@/models/company/types'
import { synchronizationModel } from '@/models/synchronization/model'

import type { TCompanyFormValues, TCompanyState } from './types'

export const save = async (
  state: TCompanyState,
  formData: FormData
): Promise<TCompanyState> => {
  const { company } = await requireEditor()
  const values = Object.fromEntries(formData) as TCompanyFormValues
  formData.delete('updatedAt')
  formData.set('id', company.id)
  const result = await handleFormAction(companyModel.save, state, formData)
  if (result.success) {
    refresh()
    return { ...result, values: undefined }
  }
  // React resets the form after the action, so the typed values come back as the defaults on an error (#56)
  return { ...result, values }
}

export const loadDeviceChanges = async (): Promise<
  TActionState<TCompanyChange[]>
> => {
  const {
    company: { id: companyId, deviceCredentials }
  } = await requireEditor()
  return await handleAction(() =>
    synchronizationModel.loadCompanyChanges({
      companyId,
      credentials: deviceCredentials
    })
  )
}

export const importFromDevice = async (
  fields: TDeviceCompanyField[]
): Promise<TActionState<Company>> => {
  const {
    company: { id: companyId, deviceCredentials }
  } = await requireEditor()
  return await handleAction(async () => {
    const data = await synchronizationModel.synchronizeCompany({
      companyId,
      credentials: deviceCredentials,
      fields
    })
    refresh()
    return data
  })
}
