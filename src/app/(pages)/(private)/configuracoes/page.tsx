import { adminUserModel } from '@/models/admin-user/model'

import { MainContent } from './_components/main-content'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Settings = async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  return <MainContent adminUser={adminUser} />
}

export default Settings
