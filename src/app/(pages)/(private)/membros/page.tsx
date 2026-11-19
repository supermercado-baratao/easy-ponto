import { MainContent } from './_components/main-content'
import { getMembersPageData } from './data'

const Members = async () => {
  const data = await getMembersPageData()
  return <MainContent {...data} />
}

export default Members
