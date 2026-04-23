import { Suspense } from 'react'

import { Loader } from '@/app/components'

import Info from './info'

type TProps = {
  params: Promise<{ pis: string }>
}

const PunchRecordsByUser = async ({ params }: TProps) => {
  const { pis } = await params

  return (
    <Suspense fallback={<Loader />}>
      <Info pis={pis} />
    </Suspense>
  )
}

export default PunchRecordsByUser
