import { MainContent } from './_components/main-content'
import { getSettingsPageData } from './data'

const Settings = async () => {
  const company = await getSettingsPageData()
  return <MainContent company={company} />
}

export default Settings
