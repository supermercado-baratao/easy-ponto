'use client'

import { useActionState, useRef } from 'react'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { useAuthFormFeedback } from '@/app/hooks/use-auth-form-feedback'

import { setUp } from './actions'
import type { TSetupState } from './types'

export const SetupForm = () => {
  const initialState: TSetupState = {}
  const [state, formAction, pending] = useActionState(setUp, initialState)
  const formReference = useRef<HTMLFormElement>(null)
  useAuthFormFeedback(state, pending, formReference)

  return (
    <form
      ref={formReference}
      action={formAction}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormField
        name="companyName"
        label="Nome da empresa"
        autoComplete="organization"
        defaultValue={state.values?.companyName}
        error={state.errors?.companyName}
      />
      <FormField
        name="name"
        label="Seu nome"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={state.errors?.name}
      />
      <FormField
        name="email"
        type="email"
        label="E-mail"
        autoComplete="username"
        defaultValue={state.values?.email}
        error={state.errors?.email}
      />
      <FormField
        name="password"
        type="password"
        label="Senha"
        autoComplete="new-password"
        error={state.errors?.password}
      />
      <FormField
        name="passwordConfirmation"
        type="password"
        label="Confirme a senha"
        autoComplete="new-password"
        error={state.errors?.passwordConfirmation}
      />
      <Button type="submit" disabled={pending} focusableWhenDisabled>
        {pending ? <Loader mode="inline" label="Cadastrar" /> : 'Cadastrar'}
      </Button>
    </form>
  )
}
