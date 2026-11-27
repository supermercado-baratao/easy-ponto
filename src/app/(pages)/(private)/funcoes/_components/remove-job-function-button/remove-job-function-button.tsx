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
import type { JobFunction } from '@/infra/database/types'

import { CREATE_FUNCTION_BUTTON_ID } from '../utils'
import { removeJobFunction } from './actions'
import type { TRemoveJobFunctionState } from './types'

export const RemoveJobFunctionButton = ({
  jobFunction
}: {
  jobFunction: JobFunction
}) => {
  const initialState: TRemoveJobFunctionState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveJobFunctionState,
      formData: FormData
    ): Promise<TRemoveJobFunctionState> => {
      const result = await removeJobFunction(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Função removida com sucesso!')
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
            aria-label={`Remover ${jobFunction.name}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(
                `#${CREATE_FUNCTION_BUTTON_ID}`
              )
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover função?</AlertDialogTitle>
          <AlertDialogDescription>
            {`A função ${jobFunction.name} sai do cadastro de funções. Se ela estiver atribuída a algum funcionário, a remoção é recusada.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={jobFunction.id} />
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
