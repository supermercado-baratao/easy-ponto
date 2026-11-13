import { getAdminUser } from '@/entry/admin-user'
import { hoursBankModel } from '@/models/hours-bank/model'
import type { THoursBankReport } from '@/models/hours-bank/types'

import { ORDER_PARAM } from './_components/utils'

type THoursReportPageData = {
  report: THoursBankReport | null
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
  const { companyId } = await getAdminUser()
  const report = companyId
    ? await hoursBankModel.generate({
        companyId,
        initialDate,
        finalDate,
        order: order === ORDER_PARAM.name ? 'name' : 'balance'
      })
    : null
  return { report }
}
