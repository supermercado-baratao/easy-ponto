'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Checkbox } from '@/app/components/ui/shadcn/checkbox'
import { Label } from '@/app/components/ui/shadcn/label'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import { STATUS_LABELS } from '@/app/utils/user-status'
import type { JobFunction, UserGroup } from '@/infra/database/types'
import { findPayrollFunction } from '@/models/job-function/utils'
import { USER_STATUSES } from '@/models/user/utils'

import { save } from './actions'
import { GroupsField, JobFunctionsField } from './organization-fields'
import type { TUserFormState, TUserFormValues } from './types'

const STATUS_OPTIONS = USER_STATUSES.map((status) => ({
  value: status,
  label: STATUS_LABELS[status]
}))

export const UserForm = ({
  groups,
  jobFunctions,
  defaultValues,
  onSaved
}: {
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  defaultValues: TUserFormValues
  onSaved: () => void
}) => {
  const initialState: TUserFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)
  const [position, setPosition] = useState(values.position ?? '')
  // The payroll position already stands for its function, with the checkbox below it
  const payrollFunction = findPayrollFunction(jobFunctions, position)
  const otherFunctions = jobFunctions.filter(
    ({ id: jobFunctionId }) => jobFunctionId !== payrollFunction?.id
  )

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
          label="Cargo na folha"
          description="O cargo da folha de pagamento, que os documentos legais mostram."
          defaultValue={values.position}
          onChange={(event) => setPosition(event.target.value)}
          error={state.errors?.position}
        />
        <Label className="-mt-1 font-normal">
          <Checkbox
            name="payrollPositionActive"
            value="true"
            uncheckedValue="false"
            defaultChecked={values.payrollPositionActive !== 'false'}
          />
          Exerce o cargo na folha
        </Label>
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
        <JobFunctionsField
          jobFunctions={otherFunctions}
          defaultValue={values.jobFunctions ?? []}
        />
        <GroupsField groups={groups} defaultValue={values.groupIds ?? []} />
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
