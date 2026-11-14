'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import type { JustificationType } from '@/infra/database/types'

import { save } from './actions'
import type { TJustificationFormState, TJustificationFormValues } from './types'

export const JustificationForm = ({
  userId,
  types,
  defaultValues,
  onSaved
}: {
  userId: string
  types: JustificationType[]
  defaultValues: TJustificationFormValues
  onSaved: () => void
}) => {
  const initialState: TJustificationFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const timesHintId = `${id}-times-hint`
  const formReference = useRef<HTMLFormElement>(null)
  const typeOptions = types.map((type) => ({
    value: type.id,
    label: `${type.code} – ${type.description}`
  }))

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Justificativa salva com sucesso!')
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

  const getFieldProps = (
    name: keyof TJustificationFormValues
  ): {
    id: string
    name: string
    defaultValue?: string
    error?: string
  } => {
    const error = state.errors?.[name as keyof typeof state.errors]
    return {
      id: `${id}-${name}`,
      name,
      defaultValue: values[name],
      error
    }
  }

  return (
    <>
      <form
        ref={formReference}
        id={formId}
        action={formAction}
        noValidate
        className="flex flex-col gap-4 overflow-y-auto px-4"
      >
        <input type="hidden" name="userId" value={userId} />
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <Select
          id={`${id}-typeId`}
          name="typeId"
          label="Tipo"
          placeholder="Selecione o tipo"
          options={typeOptions}
          defaultValue={values.typeId}
          error={state.errors?.typeId}
        />
        <div className="grid grid-cols-2 gap-x-2">
          <FormField
            {...getFieldProps('startDate')}
            type="date"
            label="Data inicial"
          />
          <FormField
            {...getFieldProps('endDate')}
            type="date"
            label="Data final"
          />
        </div>
        <fieldset
          aria-describedby={timesHintId}
          className="flex flex-col gap-3"
        >
          <legend className="sr-only">Horário</legend>
          <p id={timesHintId} className="text-sm text-muted-foreground">
            Deixe os horários em branco para justificar o dia inteiro. Um
            horário só vale numa justificativa de um único dia.
          </p>
          <div className="grid grid-cols-2 gap-x-2">
            <FormField
              {...getFieldProps('startTime')}
              type="time"
              label="Horário de início"
            />
            <FormField
              {...getFieldProps('endTime')}
              type="time"
              label="Horário de fim"
            />
          </div>
        </fieldset>
        <FormField {...getFieldProps('note')} label="Observação" />
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
