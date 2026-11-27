'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import type { UserGroup } from '@/infra/database/types'
import {
  getDescendantIds,
  getGroupLabel,
  sortGroupsByPath
} from '@/models/user-group/utils'

import { save } from './actions'
import type { TUserGroupFormState, TUserGroupFormValues } from './types'

export const UserGroupForm = ({
  groups,
  defaultValues,
  onSaved
}: {
  groups: UserGroup[]
  defaultValues: TUserGroupFormValues
  onSaved: () => void
}) => {
  const initialState: TUserGroupFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)
  const unavailable = values.id
    ? new Set([values.id, ...getDescendantIds(groups, values.id)])
    : new Set<string>()
  const parentOptions = [
    { value: null, label: 'Nenhum' },
    ...sortGroupsByPath(groups)
      .filter((group) => !unavailable.has(group.id))
      .map((group) => ({
        value: group.id,
        label: getGroupLabel(groups, group.id)
      }))
  ]

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Grupo salvo com sucesso!')
      onSaved()
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
      return
    }

    showActionError(state)
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
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          defaultValue={values.name}
          error={state.errors?.name}
        />
        <Select
          id={`${id}-parent`}
          name="parentId"
          label="Dentro de"
          description="O grupo acima deste, como o setor de uma seção."
          placeholder="Nenhum"
          options={parentOptions}
          defaultValue={values.parentId || null}
          error={state.errors?.parentId}
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
          {pending ? <Loader mode="inline" label="Salvar" /> : 'Salvar'}
        </Button>
      </SheetFooter>
    </>
  )
}
