import { redirect } from 'next/navigation'

import { getHomePath, SETUP_PATH } from '@/entry/session'
import { accountModel } from '@/models/account/model'

export const redirectSignedInUser = async (): Promise<void> => {
  const homePath = await getHomePath()
  if (homePath) redirect(homePath)
  if (!(await accountModel.isSetUp())) redirect(SETUP_PATH)
}
