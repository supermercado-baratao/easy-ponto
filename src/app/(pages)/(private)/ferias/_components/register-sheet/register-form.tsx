'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import type { JustificationType } from '@/infra/database/types'

import { register } from './actions'
import type { TRegisterFormState, TRegisterFormValues } from './types'

export const RegisterForm = ({
  types,
  defaultValues,
  onSaved
}: {
  types: JustificationType[]
  defaultValues: TRegisterFormValues
  onSaved: () => void
}) => {
  const initialState: TRegisterFormState = {}
  const [state, formAction, pending] = useActionState(register, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)
  const typeOptions = types.map((type) => ({
    value: type.id,
    label: type.name
  }))

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Férias registradas com sucesso!')
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
        <input type="hidden" name="userId" value={values.userId} />
        <input type="hidden" name="year" value={values.year} />
        <Select
          id={`${id}-typeId`}
          name="typeId"
          label="Tipo de justificativa"
          placeholder="Selecione o tipo"
          options={typeOptions}
          defaultValue={values.typeId}
          error={state.errors?.typeId}
        />
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            id={`${id}-startDate`}
            name="startDate"
            type="date"
            label="Data inicial"
            defaultValue={values.startDate}
            error={state.errors?.startDate}
          />
          <FormField
            id={`${id}-endDate`}
            name="endDate"
            type="date"
            label="Data final"
            defaultValue={values.endDate}
            error={state.errors?.endDate}
          />
        </div>
        <FormField
          id={`${id}-note`}
          name="note"
          label="Observação"
          defaultValue={values.note}
          error={state.errors?.note}
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
          {pending ? <Loader mode="inline" label="Registrar" /> : 'Registrar'}
        </Button>
      </SheetFooter>
    </>
  )
}
