import { MainContent } from './_components/main-content'
import { getJustificationTypesPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const JustificationTypes = async () => {
  const data = await getJustificationTypesPageData()
  return <MainContent {...data} />
}

export default JustificationTypes
