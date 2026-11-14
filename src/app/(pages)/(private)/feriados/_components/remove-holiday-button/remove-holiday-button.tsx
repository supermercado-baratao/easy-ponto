'use client'

import { Trash2 } from 'lucide-react'
import { useActionState, useState } from 'react'
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
import type { THolidayInYear } from '@/models/holiday/types'

import { NATIONAL_HOLIDAYS_BUTTON_ID } from '../national-holidays-button/utils'
import { getHolidayLabel } from '../utils'
import { removeHoliday } from './actions'
import type { TRemoveHolidayState } from './types'

export const RemoveHolidayButton = ({
  holiday
}: {
  holiday: THolidayInYear
}) => {
  const initialState: TRemoveHolidayState = {}
  const [open, setOpen] = useState(false)
  // The row unmounts with the refresh that comes with the result, so the toast can't wait for an effect
  // and the focus can't return to the trigger
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveHolidayState,
      formData: FormData
    ): Promise<TRemoveHolidayState> => {
      const result = await removeHoliday(previousState, formData)
      if (result.success) {
        toast.success('Feriado removido com sucesso!')
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
  const label = getHolidayLabel(holiday)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Remover ${label}`} />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent
        finalFocus={() =>
          document.querySelector<HTMLElement>(`#${NATIONAL_HOLIDAYS_BUTTON_ID}`)
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Remover feriado?</AlertDialogTitle>
          <AlertDialogDescription>
            {holiday.recurring
              ? `${label} deixa de ser feriado em todos os anos.`
              : `${label} deixa de ser feriado.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={holiday.id} />
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
