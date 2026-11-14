'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Checkbox } from '@/app/components/ui/shadcn/checkbox'
import { Label } from '@/app/components/ui/shadcn/label'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { HOLIDAY_SCOPES } from '@/models/holiday/utils'

import { SCOPE_LABELS } from '../utils'
import { save } from './actions'
import type { THolidayFormState, THolidayFormValues } from './types'

const SCOPE_OPTIONS = HOLIDAY_SCOPES.map((scope) => ({
  value: scope,
  label: SCOPE_LABELS[scope]
}))

export const HolidayForm = ({
  defaultValues,
  onSaved
}: {
  defaultValues: THolidayFormValues
  onSaved: () => void
}) => {
  const initialState: THolidayFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Feriado salvo com sucesso!')
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
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <FormField
          id={`${id}-date`}
          name="date"
          type="date"
          label="Data"
          defaultValue={values.date}
          error={state.errors?.date}
        />
        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          defaultValue={values.name}
          error={state.errors?.name}
        />
        <Select
          id={`${id}-scope`}
          name="scope"
          label="Abrangência"
          placeholder="Selecione a abrangência"
          options={SCOPE_OPTIONS}
          defaultValue={values.scope}
          error={state.errors?.scope}
        />
        <Label className="font-normal">
          <Checkbox
            key={values.recurring}
            name="recurring"
            defaultChecked={values.recurring === 'on'}
          />
          Repete todo ano
        </Label>
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
