import { requireCompany } from '@/entry/session'
import { pendingItemModel } from '@/models/pending-item/model'
import type { TPendingItems } from '@/models/pending-item/types'

type TPendingItemsPageData = TPendingItems & { canEdit: boolean }

export const getPendingItemsPageData =
  async (): Promise<TPendingItemsPageData> => {
    const {
      company: { id: companyId },
      canEdit
    } = await requireCompany()
    const pendingItems = await pendingItemModel.findManyByCompanyId({
      companyId,
      canEdit
    })
    return { ...pendingItems, canEdit }
  }
