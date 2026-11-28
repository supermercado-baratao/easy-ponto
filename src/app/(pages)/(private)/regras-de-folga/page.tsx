import { MainContent } from './_components/main-content'
import { getRestRulesPageData } from './data'

const RestRules = async () => {
  const data = await getRestRulesPageData()
  return <MainContent {...data} />
}

export default RestRules
