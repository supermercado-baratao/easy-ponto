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

import { CREATE_RESTRICTION_BUTTON_ID } from '../utils'
import { removeRestRestriction } from './actions'
import type { TRemoveRestRestrictionState } from './types'

export const RemoveRestRestrictionButton = ({
  id,
  label
}: {
  id: string
  label: string
}) => {
  const initialState: TRemoveRestRestrictionState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveRestRestrictionState,
      formData: FormData
    ): Promise<TRemoveRestRestrictionState> => {
      const result = await removeRestRestriction(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Restrição de folga removida com sucesso!')
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
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remover a restrição “${label}”`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(
                `#${CREATE_RESTRICTION_BUTTON_ID}`
              )
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover restrição de folga?</AlertDialogTitle>
          <AlertDialogDescription>
            {`A restrição “${label}” deixa de valer. As folgas já geradas continuam nos ajustes do dia até serem geradas de novo.`}
          </AlertDialogDescription>
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
