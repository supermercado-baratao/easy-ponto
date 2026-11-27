import type { JobFunction, User } from '@/infra/database/types'

export const MIN_JOB_FUNCTION_LEVEL = 1

export const MAX_JOB_FUNCTION_LEVEL = 99

type TFunctionNode = Pick<JobFunction, 'id' | 'name' | 'level'>

export type TUserJobFunctionLink = { jobFunctionId: string; active: boolean }

export type TUserFunctionsSource = Pick<
  User,
  'position' | 'payrollPositionActive'
> & { jobFunctions: TUserJobFunctionLink[] }

export type TUserFunction = {
  jobFunctionId: string | null
  name: string
  level: number | null
  payroll: boolean
  active: boolean
}

export const isSameFunctionName = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase()

export const findPayrollFunction = <T extends TFunctionNode>(
  functions: T[],
  position: string | null
): T | undefined =>
  position?.trim()
    ? functions.find((jobFunction) =>
        isSameFunctionName(jobFunction.name, position)
      )
    : undefined

const compareFunctions = (a: TUserFunction, b: TUserFunction): number =>
  Number(b.active) - Number(a.active) ||
  (b.level ?? 0) - (a.level ?? 0) ||
  Number(b.payroll) - Number(a.payroll) ||
  a.name.localeCompare(b.name, 'pt-BR')

// The payroll position comes first among equals, since the legal documents always show it
export const getUserFunctions = (
  user: TUserFunctionsSource,
  functions: TFunctionNode[]
): TUserFunction[] => {
  const payrollFunction = findPayrollFunction(functions, user.position)
  const payroll: TUserFunction[] = user.position?.trim()
    ? [
        {
          jobFunctionId: payrollFunction?.id ?? null,
          name: user.position,
          level: payrollFunction?.level ?? null,
          payroll: true,
          active: user.payrollPositionActive
        }
      ]
    : []
  const byId = new Map(
    functions.map((jobFunction) => [jobFunction.id, jobFunction])
  )
  const others: TUserFunction[] = []
  for (const { jobFunctionId, active } of user.jobFunctions) {
    const jobFunction = byId.get(jobFunctionId)
    if (!jobFunction || jobFunction.id === payrollFunction?.id) continue
    others.push({
      jobFunctionId,
      name: jobFunction.name,
      level: jobFunction.level,
      payroll: false,
      active
    })
  }
  return [...payroll, ...others].toSorted(compareFunctions)
}

export const getMainFunction = (
  userFunctions: TUserFunction[]
): TUserFunction | null =>
  userFunctions.toSorted(compareFunctions).find(({ active }) => active) ?? null

export const getActiveFunctionIds = (
  user: TUserFunctionsSource,
  functions: TFunctionNode[]
): Set<string> =>
  new Set(
    getUserFunctions(user, functions).flatMap(({ jobFunctionId, active }) =>
      active && jobFunctionId ? [jobFunctionId] : []
    )
  )

export const getMissingPayrollPositions = (
  positions: (string | null)[],
  functions: Pick<JobFunction, 'name'>[]
): string[] => {
  const missing: string[] = []
  for (const position of positions) {
    const name = position?.trim()
    if (
      name &&
      [...functions, ...missing.map((value) => ({ name: value }))].every(
        (jobFunction) => !isSameFunctionName(jobFunction.name, name)
      )
    ) {
      missing.push(name)
    }
  }
  return missing.toSorted((a, b) => a.localeCompare(b, 'pt-BR'))
}

export const findFunctionByName = <T extends TFunctionNode>(
  functions: T[],
  name: string
): T | undefined =>
  functions.find((jobFunction) => isSameFunctionName(jobFunction.name, name))
