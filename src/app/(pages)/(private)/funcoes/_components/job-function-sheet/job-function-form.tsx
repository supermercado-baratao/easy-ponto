'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, FormTextarea } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import {
  MAX_JOB_FUNCTION_LEVEL,
  MIN_JOB_FUNCTION_LEVEL
} from '@/models/job-function/utils'

import { save } from './actions'
import type { TJobFunctionFormState, TJobFunctionFormValues } from './types'

export const JobFunctionForm = ({
  defaultValues,
  onSaved
}: {
  defaultValues: TJobFunctionFormValues
  onSaved: () => void
}) => {
  const initialState: TJobFunctionFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Função salva com sucesso!')
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
        <FormField
          id={`${id}-level`}
          name="level"
          type="number"
          inputMode="numeric"
          min={MIN_JOB_FUNCTION_LEVEL}
          max={MAX_JOB_FUNCTION_LEVEL}
          label="Nível"
          description="Quanto maior, mais alto na hierarquia. A função ativa de nível mais alto é a principal do funcionário."
          defaultValue={values.level}
          error={state.errors?.level}
        />
        <FormTextarea
          id={`${id}-description`}
          name="description"
          label="Descrição"
          placeholder="O que a função faz"
          defaultValue={values.description}
          error={state.errors?.description}
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
