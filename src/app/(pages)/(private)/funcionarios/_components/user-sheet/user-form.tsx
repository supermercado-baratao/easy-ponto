'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { USER_STATUSES } from '@/models/user/utils'

import { STATUS_LABELS } from '../utils'
import { save } from './actions'
import type { TUserFormState, TUserFormValues } from './types'

const STATUS_OPTIONS = USER_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status]
}))

export const UserForm = ({
  defaultValues,
  onSaved
}: {
  defaultValues: TUserFormValues
  onSaved: () => void
}) => {
  const initialState: TUserFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Funcionário salvo com sucesso!')
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
        <input type="hidden" name="id" value={values.id} />
        <Select
          id={`${id}-status`}
          name="status"
          label="Situação"
          placeholder="Selecione a situação"
          options={STATUS_OPTIONS}
          defaultValue={values.status}
          error={state.errors?.status}
        />
        <FormField
          id={`${id}-position`}
          name="position"
          label="Cargo"
          defaultValue={values.position}
          error={state.errors?.position}
        />
        <FormField
          id={`${id}-department`}
          name="department"
          label="Departamento"
          defaultValue={values.department}
          error={state.errors?.department}
        />
        <FormField
          id={`${id}-admission-date`}
          name="admissionDate"
          type="date"
          label="Admissão"
          defaultValue={values.admissionDate}
          error={state.errors?.admissionDate}
        />
        <FormField
          id={`${id}-payroll-number`}
          name="payrollNumber"
          label="Nº na folha"
          defaultValue={values.payrollNumber}
          error={state.errors?.payrollNumber}
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
