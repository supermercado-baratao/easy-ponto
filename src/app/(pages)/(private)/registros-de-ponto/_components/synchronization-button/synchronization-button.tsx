'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'

import { synchronize } from './actions'
import { TSynchronizationState } from './types'

export const SynchronizationButton = () => {
  const initialState: TSynchronizationState = {}
  const [state, formAction, pending] = useActionState(synchronize, initialState)

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

  return (
    <>
      <form action={formAction}>
        <Button type="submit" disabled={pending} variant="outline">
          Sincronizar
        </Button>
      </form>
      <Loader open={pending} />
    </>
  )
}
