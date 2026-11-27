'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import { TIME_FIELD_LABELS } from '@/app/utils/time-field'
import { TIME_FIELDS } from '@/constants/time'
import {
  CYCLE_DAYS,
  getDayTimeFieldName,
  MAX_CYCLE_LENGTH,
  MIN_CYCLE_LENGTH,
  SHIFT_PATTERN_TEMPLATES
} from '@/models/shift-pattern/utils'

import { save } from './actions'
import type {
  TShiftPatternFormState,
  TShiftPatternFormValues,
  TShiftPatternSheetMode
} from './types'
import { getDayFormValues } from './utils'

const TEMPLATE_OPTIONS = SHIFT_PATTERN_TEMPLATES.map(({ key, label }) => ({
  value: key,
  label
}))

const START_DATE_DESCRIPTIONS: Record<TShiftPatternSheetMode, string> = {
  create: 'O primeiro dia do ciclo.',
  'new-version':
    'O primeiro dia do ciclo desta versão. A anterior continua valendo nos dias antes dela.',
  'edit-version': 'O primeiro dia do ciclo desta versão.'
}

const countCycleDays = (cycleLength: string): number => {
  const count = Number(cycleLength)
  return Number.isSafeInteger(count)
    ? Math.min(Math.max(count, 0), MAX_CYCLE_LENGTH)
    : 0
}

export const ShiftPatternForm = ({
  mode,
  defaultValues,
  onSaved
}: {
  mode: TShiftPatternSheetMode
  defaultValues: TShiftPatternFormValues
  onSaved: () => void
}) => {
  const [values, setValues] = useState(defaultValues)
  const [cycleLength, setCycleLength] = useState(
    defaultValues.cycleLength ?? ''
  )
  // A template replaces the days, which are uncontrolled, so their inputs mount again with its times
  const [templateKey, setTemplateKey] = useState(0)
  const initialState: TShiftPatternFormState = {}
  const [state, formAction, pending] = useActionState(
    async (
      previousState: TShiftPatternFormState,
      formData: FormData
    ): Promise<TShiftPatternFormState> => {
      const result = await save(previousState, formData)
      const { values } = result
      if (values) setValues((previous) => ({ ...previous, ...values }))
      return result
    },
    initialState
  )
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Escala salva com sucesso!')
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

  // The template select mounts again empty, so the same template can be picked again, and keeps the focus
  useEffect(() => {
    if (templateKey > 0)
      formReference.current
        ?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}-template"]`)
        ?.focus()
  }, [id, templateKey])

  const applyTemplate = (key: string | null): void => {
    const template = SHIFT_PATTERN_TEMPLATES.find(
      (template) => template.key === key
    )
    if (!template) return
    setValues((values) => ({ ...values, ...getDayFormValues(template.days) }))
    setCycleLength(String(template.days.length))
    setTemplateKey((key) => key + 1)
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
        {values.id && <input type="hidden" name="id" value={values.id} />}
        {values.versionId && (
          <input type="hidden" name="versionId" value={values.versionId} />
        )}
        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          defaultValue={values.name}
          error={state.errors?.name}
        />
        <Select
          key={templateKey}
          id={`${id}-template`}
          name="template"
          label="Modelo"
          placeholder="Comece por um modelo"
          options={TEMPLATE_OPTIONS}
          onValueChange={applyTemplate}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id={`${id}-start-date`}
            name="startDate"
            type="date"
            label="Vigente a partir de"
            description={START_DATE_DESCRIPTIONS[mode]}
            defaultValue={values.startDate}
            error={state.errors?.startDate}
          />
          <FormField
            id={`${id}-cycle-length`}
            name="cycleLength"
            type="number"
            inputMode="numeric"
            min={MIN_CYCLE_LENGTH}
            max={MAX_CYCLE_LENGTH}
            label="Dias do ciclo"
            description={`De ${MIN_CYCLE_LENGTH} a ${MAX_CYCLE_LENGTH} dias. Depois do último, o ciclo recomeça.`}
            value={cycleLength}
            onChange={(event) => setCycleLength(event.target.value)}
            error={state.errors?.cycleLength}
          />
        </div>
        <div
          aria-hidden="true"
          className="hidden gap-2 md:grid md:grid-cols-[4rem_repeat(6,minmax(0,1fr))]"
        >
          <span />
          {TIME_FIELDS.map((field) => (
            <span key={field} className="text-xs text-muted-foreground">
              {TIME_FIELD_LABELS[field]}
            </span>
          ))}
        </div>
        {/* Every day stays mounted, so changing the cycle length doesn't lose the times typed in the hidden ones */}
        <div key={templateKey} className="flex flex-col gap-4">
          {CYCLE_DAYS.map((cycleDay) => {
            const isOutOfCycle = cycleDay > countCycleDays(cycleLength)
            const names = TIME_FIELDS.map((field) =>
              getDayTimeFieldName(cycleDay, field)
            )
            const fieldErrors = names.map((name) => state.errors?.[name])
            const error = fieldErrors.find(Boolean)
            const dayLabel = `Dia ${cycleDay}`
            const labelId = `${id}-day-${cycleDay}-label`
            const errorId = `${id}-day-${cycleDay}-error`

            return (
              <div
                key={cycleDay}
                role="group"
                aria-labelledby={labelId}
                aria-describedby={error ? errorId : undefined}
                hidden={isOutOfCycle}
                className="flex flex-col gap-1"
              >
                <div className="grid grid-cols-2 gap-2 md:grid-cols-[4rem_repeat(6,minmax(0,1fr))] md:items-center">
                  <span
                    id={labelId}
                    className="col-span-2 text-sm font-medium md:col-span-1"
                  >
                    {dayLabel}
                  </span>
                  {TIME_FIELDS.map((field, index) => {
                    const isInvalid = fieldErrors[index] !== undefined
                    return (
                      <div key={field} className="flex flex-col gap-1">
                        <span
                          aria-hidden="true"
                          className="text-xs text-muted-foreground md:hidden"
                        >
                          {TIME_FIELD_LABELS[field]}
                        </span>
                        <Input
                          type="time"
                          name={names[index]}
                          aria-label={`${dayLabel} – ${TIME_FIELD_LABELS[field]}`}
                          aria-invalid={isInvalid ? true : undefined}
                          aria-describedby={isInvalid ? errorId : undefined}
                          defaultValue={values[names[index]]}
                          disabled={isOutOfCycle}
                        />
                      </div>
                    )
                  })}
                </div>
                {error && (
                  <p id={errorId} className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Deixe o dia em branco para marcar folga. Um horário antes do anterior
          é do dia seguinte, como a saída às 07:00 depois da entrada às 19:00.
        </p>
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
