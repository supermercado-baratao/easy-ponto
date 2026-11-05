import { Suspense } from 'react'

import { Loader } from '@/app/components/ui/custom/loader'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'

import { MainContent } from './_components/main-content'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const PunchRecords = async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser?.companyId ?? '')
  const user = users[1]
    ? await userModel.findUniqueByPisWithPunchRecords(users[1].pis)
    : null
  return (
    <Suspense fallback={<Loader />}>
      <MainContent adminUser={adminUser} users={users} user={user} />
    </Suspense>
  )
}

export default PunchRecords
