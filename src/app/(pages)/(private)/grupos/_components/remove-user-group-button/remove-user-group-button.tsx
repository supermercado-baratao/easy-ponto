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
import type { UserGroup } from '@/infra/database/types'

import { CREATE_GROUP_BUTTON_ID } from '../utils'
import { removeUserGroup } from './actions'
import type { TRemoveUserGroupState } from './types'

export const RemoveUserGroupButton = ({ group }: { group: UserGroup }) => {
  const initialState: TRemoveUserGroupState = {}
  const [open, setOpen] = useState(false)
  const removedReference = useRef(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveUserGroupState,
      formData: FormData
    ): Promise<TRemoveUserGroupState> => {
      const result = await removeUserGroup(previousState, formData)
      removedReference.current = !!result.success
      if (result.success) {
        toast.success('Grupo removido com sucesso!')
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
            aria-label={`Remover ${group.name}`}
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          removedReference.current
            ? document.querySelector<HTMLElement>(`#${CREATE_GROUP_BUTTON_ID}`)
            : true
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover grupo?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Os funcionários do grupo ${group.name} deixam de fazer parte dele.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={group.id} />
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
