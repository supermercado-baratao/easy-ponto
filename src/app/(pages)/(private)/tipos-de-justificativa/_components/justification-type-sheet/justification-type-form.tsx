'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { JUSTIFICATION_EFFECTS } from '@/models/justification-type/utils'

import { EFFECT_LABELS } from '../utils'
import { save } from './actions'
import type {
  TJustificationTypeFormState,
  TJustificationTypeFormValues
} from './types'

const EFFECT_OPTIONS = JUSTIFICATION_EFFECTS.map((effect) => ({
  value: effect,
  label: EFFECT_LABELS[effect]
}))

export const JustificationTypeForm = ({
  defaultValues,
  onSaved
}: {
  defaultValues: TJustificationTypeFormValues
  onSaved: () => void
}) => {
  const initialState: TJustificationTypeFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Tipo de justificativa salvo com sucesso!')
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
          id={`${id}-code`}
          name="code"
          label="Código"
          defaultValue={values.code}
          error={state.errors?.code}
          aria-invalid={state.errors?.code ? true : undefined}
        />
        <FormField
          id={`${id}-description`}
          name="description"
          label="Descrição"
          defaultValue={values.description}
          error={state.errors?.description}
          aria-invalid={state.errors?.description ? true : undefined}
        />
        <Select
          id={`${id}-effect`}
          name="effect"
          label="Efeito"
          placeholder="Selecione o efeito"
          options={EFFECT_OPTIONS}
          defaultValue={values.effect}
          error={state.errors?.effect}
        />
      </form>
      <SheetFooter className="flex-row justify-end">
        <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? <Loader mode="inline" /> : 'Salvar'}
        </Button>
      </SheetFooter>
    </>
  )
}
