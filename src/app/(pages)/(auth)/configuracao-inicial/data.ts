import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import { SIGN_IN_PATH } from '@/entry/session'
import { accountModel } from '@/models/account/model'

export const redirectWhenSetUp = async (): Promise<void> => {
  await connection()
  if (await accountModel.isSetUp()) redirect(SIGN_IN_PATH)
}
