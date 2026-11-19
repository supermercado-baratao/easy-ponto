'use server'

import { redirect } from 'next/navigation'

import { SIGN_IN_PATH, signOut as endSession } from '@/entry/session'

export const signOut = async (): Promise<void> => {
  await endSession()
  redirect(SIGN_IN_PATH)
}
