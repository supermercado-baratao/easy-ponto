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
import { REST_RESTRICTION_KIND_LABELS } from '@/app/utils/rest-restriction'
import { getWeekdayLabel } from '@/app/utils/weekday'
import { WEEKDAYS } from '@/constants/time'
import {
  REST_RESTRICTION_KINDS,
  type TRestRestrictionKind
} from '@/models/rest-restriction/utils'
import { REST_CONSTRAINT_LEVELS } from '@/models/rest-rule/utils'

import type { TGroupOption, TUserOption } from '../types'
import { LEVEL_LABELS } from '../utils'
import { save } from './actions'
import type {
  TRestRestrictionFormState,
  TRestRestrictionFormValues
} from './types'

const KIND_OPTIONS = REST_RESTRICTION_KINDS.map((kind) => ({
  value: kind,
  label: REST_RESTRICTION_KIND_LABELS[kind]
}))

const LEVEL_OPTIONS = REST_CONSTRAINT_LEVELS.map((level) => ({
  value: level,
  label: LEVEL_LABELS[level]
}))

const KIND_DESCRIPTIONS: Record<TRestRestrictionKind, string> = {
  together:
    'Quantos destes funcionários, como os que se cobrem, podem estar de folga no mesmo dia.',
  group:
    'Quantos funcionários do grupo, e dos grupos dentro dele, podem estar de folga no mesmo dia.',
  weekdays: 'Dias da semana em que um funcionário não pode folgar.'
}

const toggle = (list: string[], value: string, checked: boolean): string[] =>
  checked ? [...list, value] : list.filter((item) => item !== value)

export const RestRestrictionForm = ({
  users,
  groups,
  defaultValues,
  onSaved
}: {
  users: TUserOption[]
  groups: TGroupOption[]
  defaultValues: TRestRestrictionFormValues
  onSaved: () => void
}) => {
  type TErrors = NonNullable<TRestRestrictionFormState['errors']>
  const initialState: TRestRestrictionFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const errors = (state.errors ?? {}) as TErrors
  const [kind, setKind] = useState(values.kind ?? null)
  const [userIds, setUserIds] = useState(values.userIds ?? [])
  const [weekdays, setWeekdays] = useState(values.weekdays ?? [])
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Restrição de folga salva com sucesso!')
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

  const maxOffField = (
    <FormField
      id={`${id}-max-off`}
      name="maxOff"
      type="number"
      inputMode="numeric"
      min={1}
      label="Máximo de folga no mesmo dia"
      defaultValue={values.maxOff}
      error={errors.maxOff}
    />
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
        {kind === 'together' &&
          userIds.map((userId) => (
            <input key={userId} type="hidden" name="userIds[]" value={userId} />
          ))}
        {kind === 'weekdays' &&
          weekdays.map((weekday) => (
            <input
              key={weekday}
              type="hidden"
              name="weekdays[]"
              value={weekday}
            />
          ))}

        <Select
          id={`${id}-kind`}
          name="kind"
          label="Tipo"
          placeholder="Selecione o tipo da restrição"
          options={KIND_OPTIONS}
          defaultValue={values.kind}
          onValueChange={setKind}
          description={
            kind ? KIND_DESCRIPTIONS[kind as TRestRestrictionKind] : undefined
          }
          error={errors.kind}
        />
        <Select
          id={`${id}-level`}
          name="level"
          label="Nível"
          placeholder="Selecione o nível"
          options={LEVEL_OPTIONS}
          defaultValue={values.level}
          description="Uma restrição obrigatória nunca é quebrada ao mover uma folga. Uma preferencial cede quando não há outro dia."
          error={errors.level}
        />
        {kind === 'together' && (
          <>
            {/* A fieldset takes no aria-invalid, so it gets the focus and the description of its error itself */}
            <FieldSet
              tabIndex={-1}
              data-invalid={!!errors.userIds}
              aria-describedby={
                errors.userIds ? `${id}-users-error` : undefined
              }
            >
              <FieldLegend variant="label">Funcionários</FieldLegend>
              {users.length > 0 ? (
                <div className="flex max-h-64 flex-col gap-3 overflow-y-auto rounded-lg border p-3">
                  {users.map((user) => (
                    <Label key={user.id} className="font-normal">
                      <Checkbox
                        checked={userIds.includes(user.id)}
                        onCheckedChange={(checked) =>
                          setUserIds((current) =>
                            toggle(current, user.id, checked)
                          )
                        }
                      />
                      {user.name}
                    </Label>
                  ))}
                </div>
              ) : (
                <FieldDescription>
                  Nenhum funcionário cadastrado.
                </FieldDescription>
              )}
              {errors.userIds && (
                <FieldError id={`${id}-users-error`}>
                  {errors.userIds}
                </FieldError>
              )}
            </FieldSet>
            {maxOffField}
          </>
        )}
        {kind === 'group' && (
          <>
            <Select
              id={`${id}-group`}
              name="userGroupId"
              label="Grupo"
              placeholder="Selecione o grupo"
              options={groups.map(({ id, label }) => ({ value: id, label }))}
              defaultValue={values.userGroupId}
              description={
                groups.length === 0
                  ? 'Nenhum grupo cadastrado em Grupos.'
                  : undefined
              }
              error={errors.userGroupId}
            />
            {maxOffField}
          </>
        )}
        {kind === 'weekdays' && (
          <>
            <Select
              id={`${id}-user`}
              name="userId"
              label="Funcionário"
              placeholder="Selecione o funcionário"
              options={users.map(({ id, name }) => ({
                value: id,
                label: name
              }))}
              defaultValue={values.userId}
              description={
                users.length === 0
                  ? 'Nenhum funcionário cadastrado.'
                  : undefined
              }
              error={errors.userId}
            />
            <FieldSet
              tabIndex={-1}
              data-invalid={!!errors.weekdays}
              aria-describedby={
                errors.weekdays ? `${id}-weekdays-error` : undefined
              }
            >
              <FieldLegend variant="label">Dias proibidos</FieldLegend>
              <FieldDescription>
                Valem para a folga da escala e para a folga movida.
              </FieldDescription>
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
              {errors.weekdays && (
                <FieldError id={`${id}-weekdays-error`}>
                  {errors.weekdays}
                </FieldError>
              )}
            </FieldSet>
          </>
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
