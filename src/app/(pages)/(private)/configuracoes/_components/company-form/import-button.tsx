import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'

import { importFromDevice } from './actions'
import { TCompanyState } from './types'

export const ImportButton = ({ isFormPending }: { isFormPending: boolean }) => {
  const initialState: TCompanyState = {}
  const [state, formAction, pending] = useActionState(
    importFromDevice,
    initialState
  )

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Dados importados com sucesso!')
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state])

  const isPending = pending || isFormPending

  return (
    <form action={formAction} className="w-1/5 min-w-20">
      <Button
        variant="outline"
        type="submit"
        disabled={isPending}
        focusableWhenDisabled
        className="w-full"
      >
        {isPending ? <Loader mode="inline" label="Importar" /> : 'Importar'}
      </Button>
    </form>
  )
}
