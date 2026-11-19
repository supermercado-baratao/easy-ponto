import { MainContent } from './_components/main-content'
import { getJustificationTypesPageData } from './data'

const JustificationTypes = async () => {
  const types = await getJustificationTypesPageData()
  return <MainContent types={types} />
}

export default JustificationTypes
