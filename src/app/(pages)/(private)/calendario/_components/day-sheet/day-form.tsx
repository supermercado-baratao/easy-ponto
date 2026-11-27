'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import { TIME_FIELD_LABELS } from '@/app/utils/time-field'
import { TIME_FIELDS } from '@/constants/time'

import type { TCalendarAssignmentOption } from '../types'
import { save } from './actions'
import type { TDayFormState, TDayFormValues } from './types'
import {
  DAY_CHOICE_DESCRIPTIONS,
  DAY_CHOICE_LABELS,
  DAY_CHOICES,
  getAssignmentsInEffect,
  isDayChoice,
  type TDayChoice
} from './utils'

export const DayForm = ({
  assignments,
  defaultValues,
  onSaved
}: {
  assignments: TCalendarAssignmentOption[]
  defaultValues: TDayFormValues
  onSaved: () => void
}) => {
  const [values, setValues] = useState(defaultValues)
  const [choice, setChoice] = useState<TDayChoice>(
    isDayChoice(defaultValues.kind) ? defaultValues.kind : 'schedule'
  )
  const initialState: TDayFormState = {}
  const [state, formAction, pending] = useActionState(
    async (
      previousState: TDayFormState,
      formData: FormData
    ): Promise<TDayFormState> => {
      const result = await save(previousState, formData)
      if (result.values) setValues(result.values)
      return result
    },
    initialState
  )
  const id = useId()
  const formId = `${id}-form`
  const timesLabelId = `${id}-times-label`
  const timesErrorId = `${id}-times-error`
  const timesHintId = `${id}-times-hint`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      if (state.changed) toast.success('Dia salvo com sucesso!')
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

  const inEffect = getAssignmentsInEffect(assignments, values.date ?? '')
  const choices = DAY_CHOICES.filter(
    (choice) => choice !== 'work' || inEffect.length > 0
  )
  const timeErrors = TIME_FIELDS.map((field) => state.errors?.[field])
  const timeError = timeErrors.find(Boolean)

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
        <input type="hidden" name="date" value={values.date} />
        <input type="hidden" name="adjustmentId" value={values.adjustmentId} />
        <Select
          id={`${id}-kind`}
          name="kind"
          label="Dia"
          placeholder="Selecione o dia"
          options={choices.map((choice) => ({
            value: choice,
            label: DAY_CHOICE_LABELS[choice]
          }))}
          // The select mounts again when its default changes, so only the saved choice is its default
          defaultValue={isDayChoice(values.kind) ? values.kind : 'schedule'}
          onValueChange={(value) => {
            if (isDayChoice(value)) setChoice(value)
          }}
          description={DAY_CHOICE_DESCRIPTIONS[choice]}
          error={state.errors?.kind}
        />
        {choice === 'work' &&
          (inEffect.length === 1 ? (
            <input
              type="hidden"
              name="shiftAssignmentId"
              value={inEffect[0].id}
            />
          ) : (
            <Select
              id={`${id}-shift-assignment`}
              name="shiftAssignmentId"
              label="Escala"
              placeholder="Selecione a escala"
              options={inEffect.map(({ id, name }) => ({
                value: id,
                label: name
              }))}
              defaultValue={values.shiftAssignmentId || null}
              error={state.errors?.shiftAssignmentId}
            />
          ))}
        {choice === 'custom' && (
          <div
            role="group"
            aria-labelledby={timesLabelId}
            aria-describedby={
              timeError ? `${timesHintId} ${timesErrorId}` : timesHintId
            }
            className="flex flex-col gap-2"
          >
            <span id={timesLabelId} className="text-sm font-medium">
              Horários
            </span>
            <div className="grid grid-cols-2 gap-2">
              {TIME_FIELDS.map((field, index) => {
                const isInvalid = timeErrors[index] !== undefined
                return (
                  <div key={field} className="flex flex-col gap-1">
                    <span
                      aria-hidden="true"
                      className="text-xs text-muted-foreground"
                    >
                      {TIME_FIELD_LABELS[field]}
                    </span>
                    <Input
                      type="time"
                      name={field}
                      aria-label={TIME_FIELD_LABELS[field]}
                      aria-invalid={isInvalid ? true : undefined}
                      aria-describedby={isInvalid ? timesErrorId : undefined}
                      defaultValue={values[field]}
                    />
                  </div>
                )
              })}
            </div>
            {timeError && (
              <p id={timesErrorId} className="text-sm text-destructive">
                {timeError}
              </p>
            )}
            <p id={timesHintId} className="text-sm text-muted-foreground">
              Um horário antes do anterior é do dia seguinte, como a saída às
              07:00 depois da entrada às 19:00.
            </p>
          </div>
        )}
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
