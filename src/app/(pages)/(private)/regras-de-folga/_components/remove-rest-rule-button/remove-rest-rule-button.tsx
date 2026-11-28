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
import type { TRestRuleWithRelations } from '@/infra/database/types'

import { CREATE_RULE_BUTTON_ID } from '../utils'
import { removeRestRule } from './actions'
import type { TRemoveRestRuleState } from './types'

export const RemoveRestRuleButton = ({
  rule
}: {
  rule: TRestRuleWithRelations
}) => {
  const initialState: TRemoveRestRuleState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveRestRuleState,
      formData: FormData
    ): Promise<TRemoveRestRuleState> => {
      const result = await removeRestRule(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Regra de folga removida com sucesso!')
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
            aria-label={`Remover ${rule.name}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(`#${CREATE_RULE_BUTTON_ID}`)
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover regra de folga?</AlertDialogTitle>
          <AlertDialogDescription>
            {`A regra ${rule.name} deixa de valer para as escalas dela. As folgas que ela já gerou continuam nos ajustes do dia até serem geradas de novo ou removidas no Calendário.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={rule.id} />
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
