import { Suspense } from 'react'

import { Loader } from '@/app/components'
import { adminUserModel, punchRecordModel, userModel } from '@/models'

import { MainContent } from './_components/main-content'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const PunchRecords = async () => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )
  const users = await userModel.findManyByCompanyId(adminUser?.companyId ?? '')
  const punchRecords = await punchRecordModel.findMany({
    pis: users[0].pis
  })
  return (
    <Suspense fallback={<Loader />}>
      <MainContent
        adminUser={adminUser}
        users={users}
        punchRecords={punchRecords}
      />
    </Suspense>
  )
}

export default PunchRecords
