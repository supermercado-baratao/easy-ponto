import { Suspense } from 'react'

import { Loader } from '@/app/components/ui/custom/loader'

import { MainContent } from './_components/main-content'
import { getPunchRecordsPageData } from './data'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const PunchRecords = async () => {
  const { adminUser, users, user } = await getPunchRecordsPageData()
  return (
    <Suspense fallback={<Loader />}>
      <MainContent adminUser={adminUser} users={users} user={user} />
    </Suspense>
  )
}

export default PunchRecords
