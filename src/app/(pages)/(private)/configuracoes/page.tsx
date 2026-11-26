import { MainContent } from './_components/main-content'
import { getSettingsPageData } from './data'

const Settings = async () => {
  const data = await getSettingsPageData()
  return <MainContent {...data} />
}

export default Settings
