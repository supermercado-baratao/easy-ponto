'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { pt } from 'zod/locales'

import { toActionError } from '@/entry/action'
import {
  parseCodeResolutionErrors,
  parseCodeResolutions,
  RESOLUTIONS_FIELD
} from '@/entry/code-resolutions'
import { requireEditor } from '@/entry/session'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TTimeCardReportFormat } from '@/models/time-card-report/types'

import type { TImportFileState } from './types'

z.config(pt())

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
      resolutions: parseCodeResolutions(formData.get(RESOLUTIONS_FIELD))
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
      const errors = parseCodeResolutionErrors(error)
      if (errors) {
        console.error(error)
        return { ...state, errors, success: false, fatalError: false }
      }
    }
    return toActionError(error)
  }
}
