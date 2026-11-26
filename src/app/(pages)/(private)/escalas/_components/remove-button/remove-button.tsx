'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/app/components/ui/shadcn/alert-dialog'
import { Button } from '@/app/components/ui/shadcn/button'
import { showActionError } from '@/app/utils/action-error'

import { CREATE_SHIFT_PATTERN_BUTTON_ID } from '../utils'
import { removeShiftPattern, removeShiftPatternVersion } from './actions'
import type { TRemoveState } from './types'

const ACTIONS = {
  'shift-pattern': removeShiftPattern,
  version: removeShiftPatternVersion
}

const SUCCESS_MESSAGES = {
  'shift-pattern': 'Escala removida com sucesso!',
  version: 'Versão removida com sucesso!'
}

export const RemoveButton = ({
  id,
  target,
  label,
  title,
  description,
  focusAfterRemovalId = CREATE_SHIFT_PATTERN_BUTTON_ID
}: {
  id: string
  target: keyof typeof ACTIONS
  label: string
  title: string
  description: string
  focusAfterRemovalId?: string
}) => {
  const initialState: TRemoveState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveState,
      formData: FormData
    ): Promise<TRemoveState> => {
      const result = await ACTIONS[target](previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success(SUCCESS_MESSAGES[target])
        setOpen(false)
      } else {
        showActionError(result)
        if (result.message) setOpen(false)
      }
      return result
    },
    initialState
  )

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon" aria-label={label} />}
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(`#${focusAfterRemovalId}`)
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              focusableWhenDisabled
              className="w-full"
            >
              {pending ? <Loader mode="inline" label="Remover" /> : 'Remover'}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
