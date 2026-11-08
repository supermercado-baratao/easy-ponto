'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import {
  getTimeFieldName,
  TIME_FIELDS,
  WEEKDAYS
} from '@/models/schedule/utils'

import { save } from './actions'
import type { TScheduleFormState, TScheduleFormValues } from './types'
import { TIME_FIELD_LABELS, WEEKDAY_LABELS } from './utils'

export const ScheduleForm = ({
  userId,
  hasSchedule,
  defaultValues,
  onSaved
}: {
  userId: string
  hasSchedule: boolean
  defaultValues: TScheduleFormValues
  onSaved: () => void
}) => {
  const initialState: TScheduleFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
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
        ?.querySelector<HTMLInputElement>('[aria-invalid="true"]')
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
        <input type="hidden" name="userId" value={userId} />
        <FormField
          name="startDate"
          type="date"
          label="Vigente a partir de"
          description={
            hasSchedule
              ? 'Mude a data para começar uma nova escala. A atual continua valendo nos dias anteriores.'
              : undefined
          }
          defaultValue={values.startDate}
          error={state.errors?.startDate}
        />
        <div
          aria-hidden="true"
          className="hidden gap-2 md:grid md:grid-cols-[5rem_repeat(6,minmax(0,1fr))]"
        >
          <span />
          {TIME_FIELDS.map((field) => (
            <span key={field} className="text-xs text-muted-foreground">
              {TIME_FIELD_LABELS[field]}
            </span>
          ))}
        </div>
        {WEEKDAYS.map(({ key }) => {
          const names = TIME_FIELDS.map((field) => getTimeFieldName(key, field))
          const fieldErrors = names.map((name) => state.errors?.[name])
          const error = fieldErrors.find(Boolean)
          const labelId = `${id}-${key}-label`
          const errorId = `${id}-${key}-error`

          return (
            <div
              key={key}
              role="group"
              aria-labelledby={labelId}
              aria-describedby={error ? errorId : undefined}
              className="flex flex-col gap-1"
            >
              <div className="grid grid-cols-2 gap-2 md:grid-cols-[5rem_repeat(6,minmax(0,1fr))] md:items-center">
                <span
                  id={labelId}
                  className="col-span-2 text-sm font-medium md:col-span-1"
                >
                  {WEEKDAY_LABELS[key]}
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
                        aria-label={`${WEEKDAY_LABELS[key]} – ${TIME_FIELD_LABELS[field]}`}
                        aria-invalid={isInvalid ? true : undefined}
                        aria-describedby={isInvalid ? errorId : undefined}
                        defaultValue={values[names[index]]}
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
        <p className="text-sm text-muted-foreground">
          Deixe o dia em branco para marcar folga.
        </p>
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
