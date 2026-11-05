import { MainContent } from './_components/main-content'
import { getAdminUser } from './data'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Settings = async () => {
  const adminUser = await getAdminUser()
  return <MainContent adminUser={adminUser} />
}

export default Settings
