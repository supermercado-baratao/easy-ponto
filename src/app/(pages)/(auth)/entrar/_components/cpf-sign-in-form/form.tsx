'use client'

import { useActionState, useRef } from 'react'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { useAuthFormFeedback } from '@/app/hooks/use-auth-form-feedback'

import { signIn } from './actions'
import type { TCpfSignInState } from './types'

export const CpfSignInForm = () => {
  const initialState: TCpfSignInState = {}
  const [state, formAction, pending] = useActionState(signIn, initialState)
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
        id="cpf-sign-in-cpf"
        name="cpf"
        label="CPF"
        inputMode="numeric"
        autoComplete="username"
        defaultValue={state.values?.cpf}
        error={state.errors?.cpf}
      />
      <FormField
        id="cpf-sign-in-password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        description="No primeiro acesso, use os cinco primeiros dígitos do CPF seguidos do último nome, em minúsculas e sem acentos."
        error={state.errors?.password}
      />
      <Button type="submit" disabled={pending} focusableWhenDisabled>
        {pending ? <Loader mode="inline" label="Entrar" /> : 'Entrar'}
      </Button>
    </form>
  )
}
