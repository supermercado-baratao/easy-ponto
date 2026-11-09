'use client'

import { useActionState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'

import { addNationalHolidays } from './actions'
import type { TNationalHolidaysState } from './types'
import { NATIONAL_HOLIDAYS_BUTTON_ID } from './utils'

export const NationalHolidaysButton = ({ year }: { year: number }) => {
  const initialState: TNationalHolidaysState = {}
  const [, formAction, pending] = useActionState(
    async (
      previousState: TNationalHolidaysState,
      formData: FormData
    ): Promise<TNationalHolidaysState> => {
      const result = await addNationalHolidays(previousState, formData)
      if (!result.success) {
        toast.error('Um erro inesperado aconteceu!', {
          description: 'Atualize a página e tente novamente.'
        })
      } else if (result.data) {
        toast.success(
          result.data === 1
            ? '1 feriado adicionado!'
            : `${result.data} feriados adicionados!`
        )
      } else {
        toast.info(
          `Os feriados nacionais de ${formData.get('year')} já estão cadastrados.`
        )
      }
      return result
    },
    initialState
  )

  return (
    <form action={formAction}>
      <input type="hidden" name="year" value={year} />
      <Button
        id={NATIONAL_HOLIDAYS_BUTTON_ID}
        type="submit"
        variant="outline"
        disabled={pending}
      >
        {pending ? <Loader mode="inline" /> : null}
        Adicionar feriados nacionais de {year}
      </Button>
    </form>
  )
}
