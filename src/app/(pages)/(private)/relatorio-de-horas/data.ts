import { requireCompany } from '@/entry/session'
import { hoursBankModel } from '@/models/hours-bank/model'
import type { THoursBankReport } from '@/models/hours-bank/types'

import { ORDER_PARAM } from './_components/utils'

type THoursReportPageData = {
  report: THoursBankReport
  canEdit: boolean
}

export const getHoursReportPageData = async ({
  initialDate,
  finalDate,
  order
}: {
  initialDate?: string
  finalDate?: string
  order?: string
}): Promise<THoursReportPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const report = await hoursBankModel.generate({
    companyId,
    initialDate,
    finalDate,
    order: order === ORDER_PARAM.name ? 'name' : 'balance'
  })
  return { report, canEdit }
}
