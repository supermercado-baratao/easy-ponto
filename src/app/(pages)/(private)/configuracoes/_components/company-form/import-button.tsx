import { Company, DeviceCredentials } from '@prisma/client'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button, Loader } from '@/app/components'
import { TCompanySynchronizationParams } from '@/models'

import { importFromDevice } from './actions'
import { TCompanyState } from './types'

export const ImportButton = ({
  adminUserId,
  deviceCredentials,
  pending: _pending,
  setCompany
}: {
  adminUserId: string
  deviceCredentials: DeviceCredentials
  pending: boolean
  setCompany: (value: Company) => void
}) => {
  const initialState: TCompanyState = {}

  const bindArguments = {
    adminUserId,
    credentials: {
      ...deviceCredentials,
      deviceCredentialsId: deviceCredentials!.id
    }
  } as TCompanySynchronizationParams

  const [state, formAction, pending] = useActionState(
    importFromDevice.bind(null, bindArguments),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados importados com sucesso!')
      setCompany(state.data as Company)
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
    <form action={formAction} className="w-1/5 min-w-20">
      <Button
        variant="outline"
        type="submit"
        disabled={isPending}
        className="w-full"
      >
        {!isPending ? 'Importar' : <Loader mode="inline" />}
      </Button>
    </form>
  )
}
