import { MainContent } from './_components/main-content'
import { getJustificationTypesPageData } from './data'

const JustificationTypes = async () => {
  const data = await getJustificationTypesPageData()
  return <MainContent {...data} />
}

export default JustificationTypes
