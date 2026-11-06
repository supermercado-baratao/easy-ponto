'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { synchronizationModel } from '@/models/synchronization/model'

import { TImportFileState } from './types'

export const importFile = async (
  state: TImportFileState,
  formData: FormData
): Promise<TImportFileState> => {
  try {
    const { id, company, deviceCredentials } = await getAdminUser()
    if (!company || !deviceCredentials) {
      throw new Error(`AdminUser ${id} has no company or device`)
    }
    const data = await synchronizationModel.importFile({
      file: formData.get('file') as File,
      company,
      credentials: deviceCredentials
    })
    refresh()
    return { ...state, data, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
