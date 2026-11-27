'use client'

import { Minus, Plus } from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'
import { showActionError } from '@/app/utils/action-error'
import type { OvertimeBand } from '@/infra/database/types'
import { minutesToTime } from '@/infra/time'
import {
  DAY_KIND_LABELS,
  DAY_KINDS,
  getOvertimeBandFieldName,
  MAX_OVERTIME_BANDS,
  MAX_OVERTIME_PERCENTAGE,
  type TDayKind
} from '@/models/journey-rules/utils'

import { save } from './actions'
import type { TOvertimeBandsFormState } from './types'

const toFormValues = (overtimeBands: OvertimeBand[]): Record<string, string> =>
  Object.fromEntries(
    DAY_KINDS.flatMap((dayKind) =>
      overtimeBands
        .filter((band) => band.dayKind === dayKind)
        .flatMap(({ upTo, percentage }, index) => [
          [
            getOvertimeBandFieldName(dayKind, index + 1, 'upTo'),
            upTo === null ? '' : minutesToTime(upTo)
          ],
          [
            getOvertimeBandFieldName(dayKind, index + 1, 'percentage'),
            String(percentage)
          ]
        ])
    )
  )

const countBands = (overtimeBands: OvertimeBand[]): Record<TDayKind, number> =>
  Object.fromEntries(
    DAY_KINDS.map((dayKind) => [
      dayKind,
      Math.max(
        1,
        overtimeBands.filter((band) => band.dayKind === dayKind).length
      )
    ])
  ) as Record<TDayKind, number>

const getPercentageLabel = (index: number, count: number): string => {
  if (count === 1) return 'Adicional de todas as horas extras (%)'
  if (index === count) return 'Adicional das demais horas (%)'
  return `Adicional da ${index}ª faixa (%)`
}

const DayKindFieldset = ({
  dayKind,
  count,
  onCountChange,
  values,
  errors
}: {
  dayKind: TDayKind
  count: number
  onCountChange: (count: number) => void
  values: Record<string, string>
  errors?: Partial<Record<string, string>>
}) => {
  const indexes = Array.from({ length: count }, (_, index) => index + 1)
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 font-medium">{DAY_KIND_LABELS[dayKind]}</legend>
      {indexes.map((index) => {
        const upTo = getOvertimeBandFieldName(dayKind, index, 'upTo')
        const percentage = getOvertimeBandFieldName(
          dayKind,
          index,
          'percentage'
        )
        return (
          <div key={index} className="grid gap-4 sm:grid-cols-2">
            {index < count && (
              <FormField
                name={upTo}
                type="time"
                label={`${index}ª faixa: até quantas horas extras no dia`}
                description="Em horas e minutos, por exemplo 02:00."
                defaultValue={values[upTo]}
                error={errors?.[upTo]}
              />
            )}
            <FormField
              name={percentage}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_OVERTIME_PERCENTAGE}
              label={getPercentageLabel(index, count)}
              defaultValue={values[percentage]}
              error={errors?.[percentage]}
              className={
                index === count && count > 1 ? 'sm:col-start-2' : undefined
              }
            />
          </div>
        )
      })}
      <div className="flex flex-wrap gap-2">
        {/* Always rendered, so the focus stays on the button when it stops applying */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count >= MAX_OVERTIME_BANDS}
          focusableWhenDisabled
          onClick={() => onCountChange(count + 1)}
        >
          <Plus aria-hidden="true" />
          Adicionar faixa
          <span className="sr-only"> ({DAY_KIND_LABELS[dayKind]})</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={count <= 1}
          focusableWhenDisabled
          onClick={() => onCountChange(count - 1)}
        >
          <Minus aria-hidden="true" />
          Remover a última faixa
          <span className="sr-only"> ({DAY_KIND_LABELS[dayKind]})</span>
        </Button>
      </div>
    </fieldset>
  )
}

const DayKindFieldsets = ({
  overtimeBands,
  values,
  errors
}: {
  overtimeBands: OvertimeBand[]
  values: Record<string, string>
  errors?: Partial<Record<string, string>>
}) => {
  const [counts, setCounts] = useState(() => countBands(overtimeBands))
  return DAY_KINDS.map((dayKind) => (
    <DayKindFieldset
      key={dayKind}
      dayKind={dayKind}
      count={counts[dayKind]}
      onCountChange={(count) =>
        setCounts((current) => ({ ...current, [dayKind]: count }))
      }
      values={values}
      errors={errors}
    />
  ))
}

export const OvertimeBandsForm = ({
  overtimeBands
}: {
  overtimeBands: OvertimeBand[]
}) => {
  const initialState: TOvertimeBandsFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const formReference = useRef<HTMLFormElement>(null)
  const values = state.values ?? toFormValues(overtimeBands)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Adicionais salvos com sucesso!')
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
      return
    }

    showActionError(state)
  }, [pending, state])

  return (
    <FormCard
      title="Adicionais de hora extra"
      description="Informe o adicional de cada tipo de dia, conforme a convenção ou o acordo coletivo da empresa. Divida-o em faixas quando ele muda com as horas extras do dia, como as 2 primeiras a 50% e as demais a 100%."
      className="h-fit"
    >
      <CardContent>
        <form
          ref={formReference}
          id="overtime-bands-form"
          className="flex flex-col gap-6"
          action={formAction}
          noValidate
        >
          <DayKindFieldsets
            // A save replaces the bands, so the row counts start again from the saved ones
            key={overtimeBands.map(({ id }) => id).join(',')}
            overtimeBands={overtimeBands}
            values={values}
            errors={state.errors}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="overtime-bands-form"
          className="w-full"
          disabled={pending}
          focusableWhenDisabled
        >
          {pending ? <Loader mode="inline" label="Salvar" /> : 'Salvar'}
        </Button>
      </CardFooter>
    </FormCard>
  )
}
