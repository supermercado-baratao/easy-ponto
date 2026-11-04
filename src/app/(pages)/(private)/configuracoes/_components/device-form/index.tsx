'use client'

import { useEffect } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import {
  Button,
  CardContent,
  CardFooter,
  FormCard,
  FormField,
  Loader
} from '@/app/components'
import type { DeviceCredentials } from '@/infra/database/types'

import { save } from './actions'
import { TDeviceFormState } from './types'

export const DeviceForm = ({
  adminUserId,
  deviceCredentials,
  setDeviceCredentials
}: {
  adminUserId: string
  deviceCredentials: DeviceCredentials | null
  setDeviceCredentials: (deviceCredentials: DeviceCredentials) => void
}) => {
  const initialState: TDeviceFormState = {
    data: deviceCredentials
  }
  const [state, formAction, pending] = useFormState(
    save.bind(null, adminUserId),
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      setDeviceCredentials(state.data as DeviceCredentials)
      return
    }

    if (state.fatalError || state.errors?.adminUserId) {
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
      return
    }
  }, [pending])

  return (
    <FormCard
      title="Dispositivo de Ponto"
      description="Adicione as credenciais do dispositivo."
      className="h-fit"
    >
      <CardContent>
        <form id="device-form" action={formAction} noValidate>
          <FormField
            name="ip"
            label="Endereço IPV4"
            defaultValue={state.data?.ip}
            error={state.errors?.ip}
          />
          <FormField
            name="login"
            label="Login"
            defaultValue={state.data?.login}
            error={state.errors?.login}
          />
          <FormField
            name="password"
            type="password"
            label="Senha"
            defaultValue={state.data?.password}
            error={state.errors?.password}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="device-form" className="w-full">
          {!pending ? 'Salvar' : <Loader mode="inline" />}
        </Button>
      </CardFooter>
    </FormCard>
  )
}
