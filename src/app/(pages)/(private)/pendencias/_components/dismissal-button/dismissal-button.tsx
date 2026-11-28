'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { showActionError } from '@/app/utils/action-error'

import { dismissPendingItem, restorePendingItem } from './actions'
import type { TDismissalState } from './types'

const MODES = {
  dismiss: {
    action: dismissPendingItem,
    text: 'Dispensar',
    success: 'Pendência dispensada com sucesso!'
  },
  restore: {
    action: restorePendingItem,
    text: 'Restaurar',
    success: 'Pendência restaurada com sucesso!'
  }
}

export const DismissalButton = ({
  mode,
  itemKey,
  itemLabel,
  focusTargetId
}: {
  mode: keyof typeof MODES
  itemKey: string
  itemLabel: string
  focusTargetId: string
}) => {
  const { action, text, success } = MODES[mode]
  const initialState: TDismissalState = {}
  // The row moves to the other tab with the refresh that comes with the result, so the toast
  // can't wait for an effect and the focus goes to the tab, which stays
  const [, formAction, pending] = useActionState(
    async (
      previousState: TDismissalState,
      formData: FormData
    ): Promise<TDismissalState> => {
      const result = await action(previousState, formData)
      if (result.success) {
        toast.success(success)
        document.querySelector<HTMLElement>(`#${focusTargetId}`)?.focus()
      } else {
        showActionError(result)
      }
      return result
    },
    initialState
  )
  return (
    <form action={formAction}>
      <input type="hidden" name="key" value={itemKey} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={pending}
        focusableWhenDisabled
        aria-label={`${text}: ${itemLabel}`}
      >
        {pending ? <Loader mode="inline" label={text} /> : text}
      </Button>
    </form>
  )
}
