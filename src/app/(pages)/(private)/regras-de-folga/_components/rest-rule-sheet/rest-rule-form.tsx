'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Checkbox } from '@/app/components/ui/shadcn/checkbox'
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet
} from '@/app/components/ui/shadcn/field'
import { Label } from '@/app/components/ui/shadcn/label'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import {
  CONSTRAINT_LABELS,
  HOLIDAY_REST_LABELS,
  LEVEL_LABELS
} from '@/app/utils/rest-rule'
import { getWeekdayLabel } from '@/app/utils/weekday'
import { WEEKDAYS } from '@/constants/time'
import type { TRestRuleWithRelations } from '@/infra/database/types'
import {
  HOLIDAY_REST_POLICIES,
  MAX_REST_DISTANCE,
  MAX_WINDOW_DAY,
  REST_CONSTRAINT_FIELD_NAMES,
  REST_CONSTRAINT_LEVELS,
  REST_CONSTRAINTS,
  type TRestConstraint
} from '@/models/rest-rule/utils'

import type { TShiftPatternOption } from '../types'
import { CONSTRAINT_DESCRIPTIONS } from '../utils'
import { save } from './actions'
import type { TRestRuleFormState, TRestRuleFormValues } from './types'

const HOLIDAY_REST_OPTIONS = HOLIDAY_REST_POLICIES.map((policy) => ({
  value: policy,
  label: HOLIDAY_REST_LABELS[policy]
}))

const LEVEL_OPTIONS = [
  { value: null, label: 'Desligada' },
  ...REST_CONSTRAINT_LEVELS.map((level) => ({
    value: level,
    label: LEVEL_LABELS[level]
  }))
]

const toggle = (list: string[], value: string, checked: boolean): string[] =>
  checked ? [...list, value] : list.filter((item) => item !== value)

type TErrors = NonNullable<TRestRuleFormState['errors']>

const ConstraintField = ({
  id,
  constraint,
  values,
  errors,
  children
}: {
  id: string
  constraint: TRestConstraint
  values: TRestRuleFormValues
  errors: TErrors
  children?: (level: string | null) => React.ReactNode
}) => {
  const name = REST_CONSTRAINT_FIELD_NAMES[constraint]
  const defaultLevel = values[`${name}Level`] || null
  const [level, setLevel] = useState(defaultLevel)
  const descriptionId = `${id}-${name}-description`

  return (
    <FieldSet
      aria-describedby={descriptionId}
      className="gap-3 rounded-lg border p-3"
    >
      <FieldLegend variant="label">{CONSTRAINT_LABELS[constraint]}</FieldLegend>
      <FieldDescription id={descriptionId}>
        {CONSTRAINT_DESCRIPTIONS[constraint]}
      </FieldDescription>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Select
          id={`${id}-${name}-level`}
          name={`${name}Level`}
          label="Nível"
          placeholder="Selecione o nível"
          options={LEVEL_OPTIONS}
          defaultValue={defaultLevel}
          onValueChange={setLevel}
          error={errors[`${name}Level`]}
        />
        {level === 'preferred' && (
          <FormField
            id={`${id}-${name}-position`}
            name={`${name}Position`}
            type="number"
            inputMode="numeric"
            min={1}
            max={REST_CONSTRAINTS.length}
            label="Ordem"
            defaultValue={values[`${name}Position`]}
            error={errors[`${name}Position`]}
          />
        )}
      </div>
      {children?.(level)}
    </FieldSet>
  )
}

export const RestRuleForm = ({
  rule,
  rules,
  shiftPatterns,
  defaultValues,
  onSaved
}: {
  rule?: TRestRuleWithRelations
  rules: TRestRuleWithRelations[]
  shiftPatterns: TShiftPatternOption[]
  defaultValues: TRestRuleFormValues
  onSaved: () => void
}) => {
  const initialState: TRestRuleFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const errors = (state.errors ?? {}) as TErrors
  const [patternIds, setPatternIds] = useState(values.shiftPatternIds ?? [])
  const [weekdays, setWeekdays] = useState(values.blockedWeekdays ?? [])
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Regra de folga salva com sucesso!')
      onSaved()
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>(
          '[aria-invalid="true"], [data-invalid="true"]'
        )
        ?.focus()
      return
    }

    showActionError(state)
  }, [pending, state, onSaved])

  const findOtherRule = (
    patternId: string
  ): TRestRuleWithRelations | undefined =>
    rules.find(
      (other) =>
        other.id !== rule?.id &&
        other.shiftPatterns.some(
          ({ shiftPatternId }) => shiftPatternId === patternId
        )
    )

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
        {/* React resets the form after the action, which unchecks the inputs of the checkboxes, so the lists go in hidden inputs */}
        {patternIds.map((patternId) => (
          <input
            key={patternId}
            type="hidden"
            name="shiftPatternIds[]"
            value={patternId}
          />
        ))}

        <FormField
          id={`${id}-name`}
          name="name"
          label="Nome"
          defaultValue={values.name}
          error={errors.name}
        />
        {/* A fieldset takes no aria-invalid, so it gets the focus and the description of its error itself */}
        <FieldSet
          tabIndex={-1}
          data-invalid={!!errors.shiftPatternIds}
          aria-describedby={
            errors.shiftPatternIds ? `${id}-patterns-error` : undefined
          }
        >
          <FieldLegend variant="label">Escalas</FieldLegend>
          <FieldDescription>
            Os funcionários dessas escalas seguem a regra. Uma escala segue uma
            regra só.
          </FieldDescription>
          {shiftPatterns.length > 0 ? (
            <div className="flex flex-col gap-3">
              {shiftPatterns.map((pattern) => {
                const otherRule = findOtherRule(pattern.id)
                return (
                  <Label key={pattern.id} className="font-normal">
                    <Checkbox
                      disabled={!!otherRule}
                      checked={patternIds.includes(pattern.id)}
                      onCheckedChange={(checked) =>
                        setPatternIds((current) =>
                          toggle(current, pattern.id, checked)
                        )
                      }
                    />
                    {otherRule
                      ? `${pattern.name} (segue a regra ${otherRule.name})`
                      : pattern.name}
                  </Label>
                )
              })}
            </div>
          ) : (
            <FieldDescription>
              Nenhuma escala cadastrada em Escalas.
            </FieldDescription>
          )}
          {errors.shiftPatternIds && (
            <FieldError id={`${id}-patterns-error`}>
              {errors.shiftPatternIds}
            </FieldError>
          )}
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">Janela da folga</FieldLegend>
          <FieldDescription>
            Os dias do mês em que a folga pode cair. A que cai fora deles é
            movida para dentro.
          </FieldDescription>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id={`${id}-window-start`}
              name="windowStartDay"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_WINDOW_DAY}
              label="Primeiro dia"
              defaultValue={values.windowStartDay}
              error={errors.windowStartDay}
            />
            <FormField
              id={`${id}-window-end`}
              name="windowEndDay"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_WINDOW_DAY}
              label="Último dia"
              description="Num mês mais curto, vale o último dia dele."
              defaultValue={values.windowEndDay}
              error={errors.windowEndDay}
            />
          </div>
        </FieldSet>
        <FormField
          id={`${id}-distances`}
          name="distances"
          label="Distâncias até a folga da escala"
          description={`Em dias, separadas por vírgula, na ordem em que são tentadas (de 1 a ${MAX_REST_DISTANCE}). Em cada distância, tenta primeiro o lado da janela.`}
          placeholder="2, 4, 6, 1"
          defaultValue={values.distances}
          error={errors.distances}
        />
        <Select
          id={`${id}-holiday-rest`}
          name="holidayRest"
          label="Feriado no dia da folga"
          placeholder="Selecione o que vale para o feriado"
          options={HOLIDAY_REST_OPTIONS}
          defaultValue={values.holidayRest}
          description="Quando o feriado não conta como folga, a folga é movida e o feriado continua de folga."
          error={errors.holidayRest}
        />
        <FieldSet>
          <FieldLegend variant="label">Restrições</FieldLegend>
          <FieldDescription>
            Uma restrição obrigatória nunca é quebrada: sem um dia que a cumpra,
            a folga não é movida e vira uma pendência. Num conflito entre
            preferenciais, a de menor ordem cede primeiro.
          </FieldDescription>
          {REST_CONSTRAINTS.map((constraint) => (
            <ConstraintField
              key={constraint}
              id={id}
              constraint={constraint}
              values={values}
              errors={errors}
            >
              {constraint === 'blocked-weekdays'
                ? (level) =>
                    level && (
                      <FieldSet
                        tabIndex={-1}
                        data-invalid={!!errors.blockedWeekdays}
                        aria-describedby={
                          errors.blockedWeekdays
                            ? `${id}-weekdays-error`
                            : undefined
                        }
                      >
                        {weekdays.map((weekday) => (
                          <input
                            key={weekday}
                            type="hidden"
                            name="blockedWeekdays[]"
                            value={weekday}
                          />
                        ))}
                        <FieldLegend variant="label" className="sr-only">
                          Dias bloqueados
                        </FieldLegend>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {WEEKDAYS.map(({ weekday }) => (
                            <Label key={weekday} className="font-normal">
                              <Checkbox
                                checked={weekdays.includes(String(weekday))}
                                onCheckedChange={(checked) =>
                                  setWeekdays((current) =>
                                    toggle(current, String(weekday), checked)
                                  )
                                }
                              />
                              {getWeekdayLabel(weekday)}
                            </Label>
                          ))}
                        </div>
                        {errors.blockedWeekdays && (
                          <FieldError id={`${id}-weekdays-error`}>
                            {errors.blockedWeekdays}
                          </FieldError>
                        )}
                      </FieldSet>
                    )
                : undefined}
            </ConstraintField>
          ))}
        </FieldSet>
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
