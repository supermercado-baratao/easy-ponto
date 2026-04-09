import { Company, DeviceCredentials } from '@prisma/client'
import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import { Button, Loader } from '@/app/components'
import { TCompanySynchronizationParams } from '@/models'

import { importFromDevice } from './actions'
import { TCompanyState } from './types'

export const ImportButton = ({
  adminUserId,
  deviceCredentials,
  pending: _pending,
  setFormState
}: {
  adminUserId: string
  deviceCredentials: DeviceCredentials
  pending: boolean
  setFormState: (value: Company) => void
}) => {
  const initialState: TCompanyState = {}

  const bindArguments = {
    adminUserId,
    credentials: {
      ...deviceCredentials,
      deviceCredentialsId: deviceCredentials!.id
    }
  } as TCompanySynchronizationParams

  const [state, formAction, pending] = useFormState(
    importFromDevice.bind(null, bindArguments),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados importados com sucesso!')
      setFormState(state.data as Company)
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
