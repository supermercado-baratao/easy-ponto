import type { TUserFormValues } from './types'

export const getFormValues = (formData: FormData): TUserFormValues => {
  const activeIds = new Set(formData.getAll('activeJobFunctionIds[]'))
  const fields = Object.fromEntries(
    [...formData].filter(
      (entry): entry is [string, string] =>
        !entry[0].endsWith('[]') && typeof entry[1] === 'string'
    )
  )
  return {
    ...fields,
    groupIds: formData.getAll('groupIds[]').map(String),
    jobFunctions: formData.getAll('jobFunctionIds[]').map((id) => ({
      jobFunctionId: String(id),
      active: activeIds.has(id)
    }))
  }
}
