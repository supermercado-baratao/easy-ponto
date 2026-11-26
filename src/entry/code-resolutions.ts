import type { z } from 'zod'

import type { TCodeResolutions } from '@/models/synchronization/types'

export const RESOLUTIONS_FIELD = 'resolutions'

export const parseCodeResolutions = (
  value: FormDataEntryValue | null
): TCodeResolutions | undefined =>
  typeof value === 'string' ? JSON.parse(value) : undefined

export const parseCodeResolutionErrors = (
  error: z.ZodError
): Record<string, string> | null => {
  if (error.issues.some(({ path }) => path[0] !== RESOLUTIONS_FIELD)) {
    return null
  }
  const errors: Record<string, string> = {}
  for (const { path, message } of error.issues) {
    errors[String(path[1])] ??= message
  }
  return errors
}
