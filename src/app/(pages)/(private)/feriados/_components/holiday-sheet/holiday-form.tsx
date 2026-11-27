'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import { MAX_YEAR, MIN_YEAR } from '@/constants/year'
import { dayjs } from '@/infra/dayjs'
import {
  getHolidayDateInYear,
  HOLIDAY_RECURRENCES,
  HOLIDAY_SCOPES,
  MAX_EASTER_OFFSET,
  MIN_EASTER_OFFSET
} from '@/models/holiday/utils'

import { RECURRENCE_LABELS, SCOPE_LABELS } from '../utils'
import { save } from './actions'
import type { THolidayFormState, THolidayFormValues } from './types'

const SCOPE_OPTIONS = HOLIDAY_SCOPES.map((scope) => ({
  value: scope,
  label: SCOPE_LABELS[scope]
}))

const RECURRENCE_OPTIONS = HOLIDAY_RECURRENCES.map((recurrence) => ({
  value: recurrence,
  label: RECURRENCE_LABELS[recurrence]
}))

const EASTER_SIDE_OPTIONS = [
  { value: 'before', label: 'Antes da Páscoa' },
  { value: 'after', label: 'Depois da Páscoa' }
]

const getEasterPreview = (
  days: string,
  side: string,
  year: number
): string | undefined => {
  const offset = Number(days) * (side === 'before' ? -1 : 1)
  if (
    days === '' ||
    !Number.isSafeInteger(offset) ||
    offset < MIN_EASTER_OFFSET ||
    offset > MAX_EASTER_OFFSET
  )
    return undefined
  const date = getHolidayDateInYear(
    {
      recurrence: 'easter',
      date: null,
      easterOffset: offset,
      firstYear: null,
      lastYear: null
    },
    year
  )
  return date ? `Em ${year}: ${dayjs(date).format('DD/MM/YYYY')}` : undefined
}

export const HolidayForm = ({
  year,
  splitsFromYear,
  defaultValues,
  onSaved
}: {
  year: number
  splitsFromYear: boolean
  defaultValues: THolidayFormValues
  onSaved: () => void
}) => {
  const initialState: THolidayFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const [recurrence, setRecurrence] = useState(values.recurrence ?? 'once')
  const [fromYear, setFromYear] = useState(values.fromYear ?? String(year))
  const [easterDays, setEasterDays] = useState(values.easterDays ?? '')
  const [easterSide, setEasterSide] = useState(values.easterSide ?? 'after')
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)
  const repeats = recurrence !== 'once'
  const appliesFromYear = splitsFromYear && fromYear !== 'all'
  const easterPreview = getEasterPreview(easterDays, easterSide, year)

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
        {splitsFromYear && (
          <Select
            id={`${id}-from-year`}
            name="fromYear"
            label="Aplicar a mudança"
            placeholder="Selecione quando aplicar"
            options={[
              { value: String(year), label: `A partir de ${year}` },
              { value: 'all', label: 'Em todos os anos' }
            ]}
            // The select mounts again when its default changes, so only the returned choice is its default
            defaultValue={values.fromYear ?? String(year)}
            onValueChange={(value) => value && setFromYear(value)}
            description={
              appliesFromYear
                ? `Os anos antes de ${year} continuam com o cadastro atual.`
                : 'Corrige o cadastro em todos os anos, inclusive os que já passaram.'
            }
          />
        )}
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
        <Select
          id={`${id}-recurrence`}
          name="recurrence"
          label="Repetição"
          placeholder="Selecione a repetição"
          options={RECURRENCE_OPTIONS}
          defaultValue={values.recurrence ?? 'once'}
          onValueChange={(value) => value && setRecurrence(value)}
          error={state.errors?.recurrence}
        />
        {recurrence === 'easter' ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Data em relação à Páscoa</legend>
            <div className="grid grid-cols-2 items-start gap-4">
              <FormField
                id={`${id}-easter-days`}
                name="easterDays"
                type="number"
                min={0}
                max={MAX_EASTER_OFFSET}
                inputMode="numeric"
                label="Dias"
                value={easterDays}
                onChange={(event) => setEasterDays(event.target.value)}
                error={state.errors?.easterDays}
              />
              <Select
                id={`${id}-easter-side`}
                name="easterSide"
                label="Antes ou depois"
                placeholder="Selecione"
                options={EASTER_SIDE_OPTIONS}
                defaultValue={values.easterSide ?? 'after'}
                onValueChange={(value) => value && setEasterSide(value)}
                error={state.errors?.easterSide}
              />
            </div>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {easterPreview}
            </p>
          </fieldset>
        ) : (
          <FormField
            id={`${id}-date`}
            name="date"
            type="date"
            label="Data"
            defaultValue={values.date}
            description={
              recurrence === 'yearly'
                ? 'Só o dia e o mês valem para os outros anos.'
                : undefined
            }
            error={state.errors?.date}
          />
        )}
        {repeats && (
          <div className="grid grid-cols-2 items-start gap-4">
            {appliesFromYear ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Primeiro ano</span>
                <span className="text-sm">{year}</span>
                <p className="-mt-1 text-sm text-muted-foreground">
                  O ano da mudança.
                </p>
                <input type="hidden" name="firstYear" value={year} />
              </div>
            ) : (
              <FormField
                id={`${id}-first-year`}
                name="firstYear"
                type="number"
                min={MIN_YEAR}
                max={MAX_YEAR}
                inputMode="numeric"
                label="Primeiro ano"
                defaultValue={values.firstYear}
                description="Em branco: desde sempre."
                error={state.errors?.firstYear}
              />
            )}
            <FormField
              id={`${id}-last-year`}
              name="lastYear"
              type="number"
              min={MIN_YEAR}
              max={MAX_YEAR}
              inputMode="numeric"
              label="Último ano"
              defaultValue={values.lastYear}
              description="Em branco: sem fim."
              error={state.errors?.lastYear}
            />
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
