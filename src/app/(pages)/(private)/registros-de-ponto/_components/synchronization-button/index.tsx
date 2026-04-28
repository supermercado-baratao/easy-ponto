'use client'

import { DeviceCredentials } from '@prisma/client'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button, Loader } from '@/app/components'
import {
  TAfdSynchronizationParams,
  TSynchronizationCredentials
} from '@/models'

import { synchronize } from './actions'
import { TSynchronizationState } from './types'

export const SynchronizationButton = ({
  companyId,
  deviceCredentials
}: {
  companyId: string
  deviceCredentials: DeviceCredentials
}) => {
  const initialState: TSynchronizationState = {}

  const credentials = {
    ...deviceCredentials,
    deviceCredentialsId: deviceCredentials.id
  } as TSynchronizationCredentials

  const bindArguments: TAfdSynchronizationParams = {
    companyId,
    credentials,
    params: {},
    userPis: null
  }

  const [state, formAction, pending] = useActionState(
    synchronize.bind(null, bindArguments),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados importados com sucesso!')
      return
    }

    if (state.fatalError) {
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
      return
    }
  }, [pending])

  return (
    <>
      <form action={formAction} className="w-1/5 min-w-20">
        <Button type="submit" disabled={pending} variant="outline">
          Sincronizar
        </Button>
      </form>
      <Loader open={pending} />
    </>
  )
}
