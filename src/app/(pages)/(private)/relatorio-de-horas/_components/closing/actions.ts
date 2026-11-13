'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { ValidationError } from '@/infra/errors'
import { hoursBankModel } from '@/models/hours-bank/model'

import type { TClosingState } from './types'

const runClosingAction = async (
  action: (companyId: string) => Promise<unknown>
): Promise<TClosingState> => {
  try {
    const { id, companyId } = await getAdminUser()
    if (!companyId) throw new Error(`AdminUser ${id} has no company`)
    await action(companyId)
    refresh()
    return { success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    if (error instanceof ValidationError) {
      return {
        success: false,
        fatalError: false,
        message: error.message,
        action: error.action
      }
    }
    return { success: false, fatalError: true }
  }
}

export const closePeriod = async (
  _state: TClosingState,
  formData: FormData
): Promise<TClosingState> =>
  await runClosingAction(
    async (companyId) =>
      await hoursBankModel.close({
        companyId,
        initialDate: formData.get('initialDate') as string,
        finalDate: formData.get('finalDate') as string
      })
  )

export const reopenPeriod = async (
  _state: TClosingState,
  formData: FormData
): Promise<TClosingState> =>
  await runClosingAction(
    async (companyId) =>
      await hoursBankModel.reopen({
        id: formData.get('id') as string,
        companyId
      })
  )
