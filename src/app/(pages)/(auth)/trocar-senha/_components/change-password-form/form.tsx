'use client'

import { useActionState, useRef } from 'react'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { useAuthFormFeedback } from '@/app/hooks/use-auth-form-feedback'

import { save } from './actions'
import type { TChangePasswordState } from './types'

export const ChangePasswordForm = () => {
  const initialState: TChangePasswordState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
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
        name="currentPassword"
        type="password"
        label="Senha atual"
        autoComplete="current-password"
        error={state.errors?.currentPassword}
      />
      <FormField
        name="newPassword"
        type="password"
        label="Nova senha"
        autoComplete="new-password"
        description="Use pelo menos 8 caracteres."
        error={state.errors?.newPassword}
      />
      <FormField
        name="passwordConfirmation"
        type="password"
        label="Confirme a nova senha"
        autoComplete="new-password"
        error={state.errors?.passwordConfirmation}
      />
      <Button type="submit" disabled={pending} focusableWhenDisabled>
        {pending ? <Loader mode="inline" label="Salvar" /> : 'Salvar'}
      </Button>
    </form>
  )
}
