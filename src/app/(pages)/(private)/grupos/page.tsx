import { MainContent } from './_components/main-content'
import { getUserGroupsPageData } from './data'

const UserGroups = async () => {
  const data = await getUserGroupsPageData()
  return <MainContent {...data} />
}

export default UserGroups
