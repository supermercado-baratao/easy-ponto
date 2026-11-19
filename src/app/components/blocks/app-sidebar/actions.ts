'use server'

import { refresh } from 'next/cache'

import { switchCompany as switchActiveCompany } from '@/entry/session'

export const switchCompany = async (companyId: string): Promise<boolean> => {
  try {
    await switchActiveCompany(companyId)
    refresh()
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
