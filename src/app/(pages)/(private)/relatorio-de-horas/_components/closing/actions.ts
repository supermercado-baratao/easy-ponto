'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { ValidationError } from '@/infra/errors'
import { hoursBankModel } from '@/models/hours-bank/model'

import type { TClosingState } from './types'

const runClosingAction = async (
  action: (companyId: string) => Promise<unknown>
): Promise<TClosingState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  try {
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
