import { redirect } from 'next/navigation'

import { getHomePath } from '@/entry/session'

export const redirectSignedInUser = async (): Promise<void> => {
  const homePath = await getHomePath()
  if (homePath) redirect(homePath)
}
