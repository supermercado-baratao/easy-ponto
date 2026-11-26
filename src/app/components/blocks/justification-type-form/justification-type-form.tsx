'use client'

import { cn } from 'cn'
import { type ReactNode, useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import {
  FormField,
  FormTextarea,
  Select
} from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { showActionError } from '@/app/utils/action-error'
import {
  EFFECT_LABELS,
  JUSTIFICATION_EFFECTS
} from '@/models/justification-type/utils'

import { save } from './actions'
import type {
  TJustificationTypeFormState,
  TJustificationTypeFormValues,
  TSavedJustificationType
} from './types'

const EFFECT_OPTIONS = JUSTIFICATION_EFFECTS.map((effect) => ({
  value: effect,
  label: EFFECT_LABELS[effect]
}))

export const JustificationTypeForm = ({
  defaultValues,
  onSaved,
  renderFooter,
  className
}: {
  defaultValues: TJustificationTypeFormValues
  onSaved: (type: TSavedJustificationType) => void
  renderFooter: (submitButton: ReactNode) => ReactNode
  className?: string
}) => {
  const initialState: TJustificationTypeFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success && state.type) {
      toast.success('Tipo de justificativa salvo com sucesso!')
      onSaved(state.type)
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
        className={cn('flex flex-col gap-4 overflow-y-auto', className)}
      >
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          defaultValue={values.name}
          error={state.errors?.name}
        />
        <FormTextarea
          id={`${id}-description`}
          name="description"
          label="Descrição"
          placeholder="O que é e quando usar"
          defaultValue={values.description}
          error={state.errors?.description}
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
      {renderFooter(
        <Button
          type="submit"
          form={formId}
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? <Loader mode="inline" label="Salvar" /> : 'Salvar'}
        </Button>
      )}
    </>
  )
}
