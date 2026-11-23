'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { hoursBankModel } from '@/models/hours-bank/model'

import type { TClosingState } from './types'

const runClosingAction = async (
  action: (companyId: string) => Promise<unknown>
): Promise<TClosingState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await action(companyId)
    refresh()
    return null
  })
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
