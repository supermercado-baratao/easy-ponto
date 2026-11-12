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
import type { JustificationType } from '@/infra/database/types'

import { CREATE_TYPE_BUTTON_ID } from '../utils'
import { removeJustificationType } from './actions'
import type { TRemoveJustificationTypeState } from './types'

export const RemoveJustificationTypeButton = ({
  type
}: {
  type: JustificationType
}) => {
  const initialState: TRemoveJustificationTypeState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveJustificationTypeState,
      formData: FormData
    ): Promise<TRemoveJustificationTypeState> => {
      const result = await removeJustificationType(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Tipo de justificativa removido com sucesso!')
        setOpen(false)
      } else if (result.message) {
        toast.error(result.message, { description: result.action })
        setOpen(false)
      } else {
        toast.error('Um erro inesperado aconteceu!', {
          description: 'Atualize a página e tente novamente.'
        })
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
            aria-label={`Remover ${type.code}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(`#${CREATE_TYPE_BUTTON_ID}`)
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover tipo de justificativa?</AlertDialogTitle>
          <AlertDialogDescription>
            {`${type.code} – ${type.description} não poderá mais ser usado nas justificativas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={type.id} />
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              className="w-full"
            >
              {pending ? <Loader mode="inline" /> : 'Remover'}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
