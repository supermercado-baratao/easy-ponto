'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'

import { save } from './actions'
import { TDeviceFormState, TDeviceFormValues } from './types'

export const DeviceForm = ({
  deviceCredentials
}: {
  deviceCredentials: TDeviceFormValues | null
}) => {
  const initialState: TDeviceFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state])

  return (
    <FormCard
      title="Dispositivo de Ponto"
      description="Adicione as credenciais do dispositivo."
      className="h-fit"
    >
      <CardContent>
        <form
          key={deviceCredentials?.updatedAt.toISOString()}
          id="device-form"
          action={formAction}
          noValidate
        >
          <FormField
            name="ip"
            label="Endereço IPV4"
            defaultValue={deviceCredentials?.ip}
            error={state.errors?.ip}
          />
          <FormField
            name="login"
            label="Login"
            defaultValue={deviceCredentials?.login}
            autoComplete="off"
            error={state.errors?.login}
          />
          <FormField
            name="password"
            type="password"
            label="Senha"
            autoComplete="new-password"
            description={
              deviceCredentials
                ? 'Deixe em branco para manter a senha atual.'
                : undefined
            }
            error={state.errors?.password}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="device-form"
          className="w-full"
          disabled={pending}
        >
          {pending ? <Loader mode="inline" /> : 'Salvar'}
        </Button>
      </CardFooter>
    </FormCard>
  )
}
