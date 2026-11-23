'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { pt } from 'zod/locales'

import { toActionError } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TFileSynchronizationParams } from '@/models/synchronization/types'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'

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
  const {
    company: { deviceCredentials, ...company }
  } = await requireEditor()
  try {
    const result = await synchronizationModel.importFile({
      file: formData.get('file') as File,
      format: formData.get('format') as TTimeCardReportFormat,
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
    if (error instanceof z.ZodError) {
      const errors = parseResolutionErrors(error)
      if (errors) {
        console.error(error)
        return { ...state, errors, success: false, fatalError: false }
      }
    }
    return toActionError(error)
  }
}
