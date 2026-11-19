'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { getAssignableRoles } from '@/models/member/utils'

import { getRoleLabel } from '../utils'
import { addMember } from './actions'
import type { TAddMemberFormState } from './types'

export const AddMemberForm = ({
  actorRole,
  onSaved
}: {
  actorRole: string
  onSaved: () => void
}) => {
  const initialState: TAddMemberFormState = {}
  const [state, formAction, pending] = useActionState(addMember, initialState)
  const values = state.values ?? {}
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)
  const roleOptions = getAssignableRoles(actorRole).map((role) => ({
    value: role,
    label: getRoleLabel(role)
  }))

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Membro adicionado com sucesso!')
      onSaved()
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
  }, [pending, state, onSaved])

  return (
    <>
      <form
        ref={formReference}
        id={formId}
        action={formAction}
        noValidate
        className="flex flex-col gap-4 overflow-y-auto px-4"
      >
        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          autoComplete="off"
          defaultValue={values.name}
          error={state.errors?.name}
        />
        <FormField
          id={`${id}-email`}
          name="email"
          type="email"
          label="E-mail"
          autoComplete="off"
          defaultValue={values.email}
          error={state.errors?.email}
        />
        <Select
          id={`${id}-role`}
          name="role"
          label="Papel"
          placeholder="Selecione o papel"
          options={roleOptions}
          defaultValue={
            values.role ??
            (roleOptions.length === 1 ? roleOptions[0].value : undefined)
          }
          error={state.errors?.role}
        />
        <FormField
          id={`${id}-password`}
          name="password"
          type="password"
          label="Senha temporária"
          autoComplete="new-password"
          description="Passe essa senha para a pessoa: no primeiro acesso, ela cria uma nova. Se o e-mail já tiver conta, a pessoa continua com a senha que já usa."
          error={state.errors?.password}
        />
      </form>
      <SheetFooter className="flex-row justify-end">
        <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
        <Button
          type="submit"
          form={formId}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? <Loader mode="inline" label="Adicionar" /> : 'Adicionar'}
        </Button>
      </SheetFooter>
    </>
  )
}
