import { requireCompany } from '@/entry/session'
import type { TCompanyWithDeviceCredentials } from '@/infra/database/types'

export const getSettingsPageData =
  async (): Promise<TCompanyWithDeviceCredentials> => {
    const { company } = await requireCompany()
    return company
  }
