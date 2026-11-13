'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useId, useRef } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import type { THoursBankOrder } from '@/models/hours-bank/types'

import { getHoursReportHref } from '../utils'
import { importInitialBalance } from './actions'
import type { TInitialBalanceState } from './types'

export const ImportInitialBalanceButton = ({
  order
}: {
  order: THoursBankOrder
}) => {
  const router = useRouter()
  const inputId = useId()
  const formReference = useRef<HTMLFormElement>(null)
  const initialState: TInitialBalanceState = {}
  const [, formAction, pending] = useActionState(
    async (
      previousState: TInitialBalanceState,
      formData: FormData
    ): Promise<TInitialBalanceState> => {
      const result = await importInitialBalance(previousState, formData)
      formReference.current?.reset()
      if (result.success && result.data) {
        const { startDate, endDate, unmatchedNames } = result.data
        toast.success('Saldo inicial importado com sucesso!')
        if (unmatchedNames.length > 0) {
          toast.warning(
            'Funcionários do relatório não encontrados no Easy Ponto',
            {
              description: `${unmatchedNames.join(', ')}. Eles ficaram sem saldo inicial.`
            }
          )
        }
        router.replace(
          getHoursReportHref({
            initialDate: startDate,
            finalDate: endDate,
            order
          })
        )
      } else if (result.message) {
        toast.error(result.message, { description: result.action })
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
    <>
      <form action={formAction} ref={formReference}>
        <Label htmlFor={inputId} className="cursor-pointer">
          <Button
            variant="outline"
            nativeButton={false}
            render={<span />}
            disabled={pending}
            focusableWhenDisabled
          >
            Importar saldo inicial
          </Button>
        </Label>
        <Input
          id={inputId}
          type="file"
          name="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          disabled={pending}
          onChange={() => formReference.current?.requestSubmit()}
        />
      </form>
      <Loader open={pending} />
    </>
  )
}
