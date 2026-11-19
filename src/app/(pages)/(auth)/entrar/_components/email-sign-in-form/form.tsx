'use client'

import { useActionState, useRef } from 'react'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { useAuthFormFeedback } from '@/app/hooks/use-auth-form-feedback'

import { signIn } from './actions'
import type { TEmailSignInState } from './types'

export const EmailSignInForm = () => {
  const initialState: TEmailSignInState = {}
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
        id="email-sign-in-email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="username"
        defaultValue={state.values?.email}
        error={state.errors?.email}
      />
      <FormField
        id="email-sign-in-password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        error={state.errors?.password}
      />
      <Button type="submit" disabled={pending} focusableWhenDisabled>
        {pending ? <Loader mode="inline" label="Entrar" /> : 'Entrar'}
      </Button>
    </form>
  )
}
