import { pendingItemModel } from '@/models/pending-item/model'

// A failure only hides the count of the sidebar, never the page
export const countPendingItems = async (params: {
  companyId: string
  canEdit: boolean
}): Promise<number | null> => {
  try {
    return await pendingItemModel.countOpen(params)
  } catch (error) {
    console.error(error)
    return null
  }
}
