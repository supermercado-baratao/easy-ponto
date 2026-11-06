import { MainContent } from './_components/main-content'
import { getSettingsPageData } from './data'

// Remove this line when authentication is implemented and the ADMIN_USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Settings = async () => {
  const adminUser = await getSettingsPageData()
  return <MainContent adminUser={adminUser} />
}

export default Settings
