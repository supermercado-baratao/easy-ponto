import type { z } from 'zod'

import type { TCodeResolution } from '@/models/synchronization/types'

export const RESOLUTIONS_FIELD = 'resolutions'

export const parseCodeResolutions = (
  value: FormDataEntryValue | null
): Record<string, TCodeResolution> | undefined =>
  typeof value === 'string' ? JSON.parse(value) : undefined

export const parseCodeResolutionErrors = (
  error: z.ZodError
): Record<string, string> | null => {
  if (error.issues.some(({ path }) => path[0] !== RESOLUTIONS_FIELD)) {
    return null
  }
  const errors: Record<string, string> = {}
  for (const { path, message } of error.issues) {
    const [, code, field = 'action'] = path.map(String)
    errors[`${code}.${field}`] ??= message
  }
  return errors
}
