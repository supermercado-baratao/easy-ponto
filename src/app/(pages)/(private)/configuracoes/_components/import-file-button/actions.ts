'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { pt } from 'zod/locales'

import { getAdminUser } from '@/entry/admin-user'
import { ValidationError } from '@/infra/errors'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TFileSynchronizationParams } from '@/models/synchronization/types'

import type { TImportFileState } from './types'

z.config(pt())

const RESOLUTIONS_PATH = 'resolutions'

const parseResolutionErrors = (
  error: z.ZodError
): Record<string, string> | null => {
  if (error.issues.some(({ path }) => path[0] !== RESOLUTIONS_PATH)) {
    return null
  }
  const errors: Record<string, string> = {}
  for (const { path, message } of error.issues) {
    const [, code, field = 'action'] = path.map(String)
    errors[`${code}.${field}`] ??= message
  }
  return errors
}

const parseResolutions = (
  value: FormDataEntryValue | null
): TFileSynchronizationParams['resolutions'] =>
  typeof value === 'string' ? JSON.parse(value) : undefined

export const importFile = async (
  state: TImportFileState,
  formData: FormData
): Promise<TImportFileState> => {
  try {
    const { id, company, deviceCredentials } = await getAdminUser()
    if (!company || !deviceCredentials) {
      throw new Error(`AdminUser ${id} has no company or device`)
    }
    const result = await synchronizationModel.importFile({
      file: formData.get('file') as File,
      company,
      credentials: deviceCredentials,
      resolutions: parseResolutions(formData.get(RESOLUTIONS_PATH))
    })
    if (result.status === 'unresolved') {
      const { unknownCodes, types } = result
      return { unknownCodes, types, success: false, fatalError: false }
    }
    refresh()
    return {
      data: result.company,
      skippedJustifications: result.skippedJustifications,
      success: true,
      fatalError: false
    }
  } catch (error) {
    console.error(error)
    if (error instanceof z.ZodError) {
      const errors = parseResolutionErrors(error)
      if (errors) {
        return { ...state, errors, success: false, fatalError: false }
      }
    }
    if (error instanceof ValidationError) {
      return {
        success: false,
        fatalError: false,
        message: error.message,
        action: error.action
      }
    }
    return { ...state, success: false, fatalError: true }
  }
}
