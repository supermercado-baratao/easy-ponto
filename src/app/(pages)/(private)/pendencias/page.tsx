import { MainContent } from './_components/main-content'
import { getPendingItemsPageData } from './data'

const PendingItems = async () => {
  const data = await getPendingItemsPageData()
  return <MainContent {...data} />
}

export default PendingItems
