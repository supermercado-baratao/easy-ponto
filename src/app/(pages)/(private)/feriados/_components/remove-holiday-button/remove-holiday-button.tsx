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
import { showActionError } from '@/app/utils/action-error'
import type { THolidayInYear } from '@/models/holiday/types'
import { startsBeforeYear } from '@/models/holiday/utils'

import { NATIONAL_HOLIDAYS_BUTTON_ID } from '../national-holidays-button/utils'
import { getHolidayLabel } from '../utils'
import { removeHoliday } from './actions'
import type { TRemoveHolidayState } from './types'

export const RemoveHolidayButton = ({
  year,
  holiday
}: {
  year: number
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
        showActionError(result)
        if (result.message) setOpen(false)
      }
      return result
    },
    initialState
  )
  const label = getHolidayLabel(holiday)
  const splitsFromYear = startsBeforeYear(holiday, year)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const getDescription = (): string => {
    if (splitsFromYear)
      return `Escolha se ${holiday.name} deixa de ser feriado a partir de ${year}, mantendo os anos anteriores, ou em todos os anos, inclusive os que já passaram.`
    if (holiday.recurrence === 'once') return `${label} deixa de ser feriado.`
    return `${holiday.name} deixa de ser feriado em todos os anos.`
  }

  const renderSubmitButton = (fromYear: string, text: string) => (
    <Button
      type="submit"
      name="fromYear"
      value={fromYear}
      variant="destructive"
      disabled={pending}
      focusableWhenDisabled
      onClick={() => setSubmitted(fromYear)}
    >
      {pending && submitted === fromYear ? (
        <Loader mode="inline" label={text} />
      ) : (
        text
      )}
    </Button>
  )

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
          <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="id" value={holiday.id} />
            {splitsFromYear &&
              renderSubmitButton(String(year), `Remover a partir de ${year}`)}
            {renderSubmitButton(
              'all',
              splitsFromYear ? 'Remover de todos os anos' : 'Remover'
            )}
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
