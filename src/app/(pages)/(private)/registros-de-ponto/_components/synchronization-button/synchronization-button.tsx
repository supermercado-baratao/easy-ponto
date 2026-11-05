import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import type {
  DeviceCredentials,
  TUserWithPunchRecords,
  User
} from '@/infra/database/types'
import {
  TAfdSynchronizationParams,
  TSynchronizationCredentials
} from '@/models/synchronization/types'

import { synchronize } from './actions'
import { TSynchronizationState } from './types'

export const SynchronizationButton = ({
  userPis,
  companyId,
  deviceCredentials,
  pending: _pending,
  setUsers,
  setUser
}: {
  userPis: string | null
  companyId: string
  deviceCredentials: DeviceCredentials
  pending: boolean
  setUsers: (value: User[]) => void
  setUser: (value: TUserWithPunchRecords | null) => void
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
    userPis
  }

  const [state, formAction, pending] = useFormState(
    synchronize.bind(null, bindArguments),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados importados com sucesso!')
      setUsers(state.data?.users || [])
      setUser(state.data?.user || null)
      return
    }

    if (state.fatalError) {
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
      return
    }
  }, [pending])

  const isPending = pending || _pending

  return (
    <>
      <form action={formAction} className="w-1/5 min-w-20">
        <Button type="submit" disabled={isPending} variant="outline">
          Sincronizar
        </Button>
      </form>
      <Loader open={isPending} />
    </>
  )
}
