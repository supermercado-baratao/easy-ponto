import { DeviceCredentials, PunchRecord, User } from '@prisma/client'
import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import { Button, Loader } from '@/app/components'
import { TState } from '@/infra/form-action'
import {
  TSynchronizationCredentials,
  TUserSynchronizationParams
} from '@/models'

import { importFromDevice } from './actions'
import { TData } from './types'

export const ImportFromDeviceButton = ({
  userPis,
  companyId,
  deviceCredentials,
  pending: _pending,
  setUsers,
  setPunchRecords
}: {
  userPis: string | null
  companyId: string | null
  deviceCredentials: DeviceCredentials | null
  pending: boolean
  setUsers: (value: User[]) => void
  setPunchRecords: (value: PunchRecord[]) => void
}) => {
  const initialState: TState<TUserSynchronizationParams, TData> = {}
  const credentials = {
    ...deviceCredentials,
    deviceCredentialsId: deviceCredentials?.id
  } as TSynchronizationCredentials

  const [state, formAction, pending] = useFormState(
    importFromDevice.bind(null, {
      userPis: userPis!,
      userParams: {
        companyId: companyId!,
        credentials
      },
      afdParams: {
        params: {},
        credentials
      }
    }),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados importados com sucesso!')
      setUsers(state.data?.users || [])
      setPunchRecords(state.data?.punchRecords || [])
      return
    }

    if (state.fatalError) {
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
      return
    }
  }, [pending])

  if (!deviceCredentials || !companyId) return null

  const isPending = pending || _pending

  return (
    <>
      <form action={formAction} className="w-1/5 min-w-20">
        <Button type="submit" disabled={isPending} variant="outline" size="sm">
          Importar
        </Button>
      </form>
      <Loader open={isPending} />
    </>
  )
}
