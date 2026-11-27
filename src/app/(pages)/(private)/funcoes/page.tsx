import { MainContent } from './_components/main-content'
import { getJobFunctionsPageData } from './data'

const JobFunctions = async () => {
  const data = await getJobFunctionsPageData()
  return <MainContent {...data} />
}

export default JobFunctions
