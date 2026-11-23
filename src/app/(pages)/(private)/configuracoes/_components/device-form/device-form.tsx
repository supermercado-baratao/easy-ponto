'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'
import {
  DEFAULT_DEVICE_MODEL,
  DEVICE_MODEL_LABELS,
  DEVICE_MODELS
} from '@/models/device/utils'

import { save } from './actions'
import { TDeviceFormState, TDeviceFormValues } from './types'

export const DeviceForm = ({
  deviceCredentials
}: {
  deviceCredentials: TDeviceFormValues | null
}) => {
  const initialState: TDeviceFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const formReference = useRef<HTMLFormElement>(null)
  const values = state.values ?? deviceCredentials

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Dados salvos com sucesso!')
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
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
          ref={formReference}
          id="device-form"
          action={formAction}
          noValidate
        >
          <Select
            name="model"
            label="Modelo do relógio"
            placeholder="Selecione o modelo"
            defaultValue={values?.model ?? DEFAULT_DEVICE_MODEL}
            options={DEVICE_MODELS.map((model) => ({
              value: model,
              label: DEVICE_MODEL_LABELS[model]
            }))}
            error={state.errors?.model}
          />
          <FormField
            name="ip"
            label="Endereço IPV4"
            defaultValue={values?.ip}
            error={state.errors?.ip}
          />
          <FormField
            name="login"
            label="Login"
            defaultValue={values?.login}
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
          focusableWhenDisabled
        >
          {pending ? <Loader mode="inline" label="Salvar" /> : 'Salvar'}
        </Button>
      </CardFooter>
    </FormCard>
  )
}
