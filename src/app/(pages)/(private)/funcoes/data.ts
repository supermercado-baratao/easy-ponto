import { requireCompany } from '@/entry/session'
import {
  getMissingPayrollPositions,
  getUserFunctions
} from '@/models/job-function/utils'
import { userModel } from '@/models/user/model'

import type { TJobFunctionRow } from './_components/types'

export const getJobFunctionsPageData = async (): Promise<{
  rows: TJobFunctionRow[]
  missingPositions: string[]
  canEdit: boolean
}> => {
  const { company, canEdit } = await requireCompany()
  const { users, jobFunctions } = await userModel.findManyWithOrganization(
    company.id
  )
  const userFunctions = users.map((user) =>
    getUserFunctions(user, jobFunctions)
  )
  return {
    rows: jobFunctions.map((jobFunction) => {
      const links = userFunctions.flatMap((functions) =>
        functions.filter(
          ({ jobFunctionId }) => jobFunctionId === jobFunction.id
        )
      )
      return {
        jobFunction,
        active: links.filter(({ active }) => active).length,
        inactive: links.filter(({ active }) => !active).length
      }
    }),
    missingPositions: getMissingPayrollPositions(
      users.map(({ position }) => position),
      jobFunctions
    ),
    canEdit
  }
}
