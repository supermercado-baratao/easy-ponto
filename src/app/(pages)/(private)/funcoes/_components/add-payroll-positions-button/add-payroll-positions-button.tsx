'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { showActionError } from '@/app/utils/action-error'

import { CREATE_FUNCTION_BUTTON_ID } from '../utils'
import { addPayrollPositions } from './actions'

const LABEL = 'Cadastrar os cargos da folha'

export const AddPayrollPositionsButton = ({
  positions
}: {
  positions: string[]
}) => {
  const [pending, startTransition] = useTransition()

  const handleClick = (): void => {
    startTransition(async () => {
      const result = await addPayrollPositions()
      if (!result.success) {
        showActionError(result)
        return
      }
      toast.success(
        result.data === 1
          ? '1 função cadastrada com o nível 1.'
          : `${result.data} funções cadastradas com o nível 1.`
      )
      // The button unmounts once no payroll position is missing, so the focus would fall to the page
      document
        .querySelector<HTMLElement>(`#${CREATE_FUNCTION_BUTTON_ID}`)
        ?.focus()
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={pending}
      focusableWhenDisabled
    >
      {pending ? (
        <Loader mode="inline" label={LABEL} />
      ) : (
        `${LABEL} (${positions.length})`
      )}
    </Button>
  )
}
