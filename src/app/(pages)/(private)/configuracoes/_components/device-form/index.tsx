'use client'

import { DeviceCredentials } from '@prisma/client'
import * as React from 'react'
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
import { TState } from '@/infra/form-action'
import { TDeviceCredentialsFormData } from '@/models'

import { saveDeviceSettings } from './actions'

export const DeviceForm = ({
  userId,
  deviceCredentials
}: {
  userId: string
  deviceCredentials: DeviceCredentials | null
}) => {
  const initialState: TState<TDeviceCredentialsFormData, DeviceCredentials> = {
    data: deviceCredentials
  }
  const [state, formAction, pending] = useFormState(
    saveDeviceSettings.bind(null, userId),
    initialState
  )

  React.useEffect(() => {
    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      return
    }

    if (state.fatalError || state.errors?.userId) {
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
      className="max-w-md mx-auto"
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
