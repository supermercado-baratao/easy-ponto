import { MainContent } from './_components/main-content'
import { getShiftPatternsPageData } from './data'

const ShiftPatterns = async () => {
  const data = await getShiftPatternsPageData()
  return <MainContent {...data} />
}

export default ShiftPatterns
