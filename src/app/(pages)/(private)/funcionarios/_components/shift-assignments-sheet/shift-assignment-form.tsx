'use client'

import { useActionState, useEffect, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { FormField, Select } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetFooter } from '@/app/components/ui/shadcn/sheet'
import { showActionError } from '@/app/utils/action-error'
import type {
  TShiftPatternVersionWithDays,
  TShiftPatternWithVersions
} from '@/infra/database/types'
import { selectVersionInEffect } from '@/models/shift-pattern/utils'

import { save } from './actions'
import type {
  TShiftAssignmentFormState,
  TShiftAssignmentFormValues
} from './types'
import { formatDayTimes } from './utils'

export const ShiftAssignmentForm = ({
  shiftPatterns,
  defaultValues,
  today,
  onDone
}: {
  shiftPatterns: TShiftPatternWithVersions[]
  defaultValues: TShiftAssignmentFormValues
  today: string
  onDone: () => void
}) => {
  const [values, setValues] = useState(defaultValues)
  const [shiftPatternId, setShiftPatternId] = useState(
    defaultValues.shiftPatternId
  )
  const [startDate, setStartDate] = useState(defaultValues.startDate)
  const [cycleStartDay, setCycleStartDay] = useState(
    defaultValues.cycleStartDay
  )
  const findVersion = (
    patternId: string | undefined,
    date: string | undefined
  ): TShiftPatternVersionWithDays | null => {
    const shiftPattern = shiftPatterns.find(({ id }) => id === patternId)
    return shiftPattern
      ? selectVersionInEffect(shiftPattern.versions, date || today)
      : null
  }
  // The select mounts again when its default changes, so the pick becomes the default only for another version
  const [mounted, setMounted] = useState({
    versionId: findVersion(shiftPatternId, startDate)?.id ?? 'none',
    cycleStartDay
  })
  const initialState: TShiftAssignmentFormState = {}
  const [state, formAction, pending] = useActionState(
    async (
      previousState: TShiftAssignmentFormState,
      formData: FormData
    ): Promise<TShiftAssignmentFormState> => {
      const result = await save(previousState, formData)
      if (result.values) {
        setValues(result.values)
        setShiftPatternId(result.values.shiftPatternId)
        setStartDate(result.values.startDate)
        setCycleStartDay(result.values.cycleStartDay)
        setMounted({
          versionId:
            findVersion(result.values.shiftPatternId, result.values.startDate)
              ?.id ?? 'none',
          cycleStartDay: result.values.cycleStartDay
        })
      }
      return result
    },
    initialState
  )
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  // The form takes the place of the list in the same sheet, so the focus would stay on the removed button
  useEffect(() => {
    formReference.current
      ?.querySelector<HTMLElement>(`[id="${CSS.escape(id)}-shift-pattern"]`)
      ?.focus()
  }, [id])

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Escala do funcionário salva com sucesso!')
      onDone()
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
      return
    }

    showActionError(state)
  }, [pending, state, onDone])

  const shiftPattern = shiftPatterns.find(({ id }) => id === shiftPatternId)
  const version = findVersion(shiftPatternId, startDate)
  const cycleDayOptions =
    version?.days.map((day) => ({
      value: String(day.cycleDay),
      label: `Dia ${day.cycleDay}: ${formatDayTimes(day)}`
    })) ?? []
  const versionId = version?.id ?? 'none'
  if (mounted.versionId !== versionId) {
    setMounted({ versionId, cycleStartDay })
  }
  const defaultCycleStartDay = cycleDayOptions.some(
    ({ value }) => value === mounted.cycleStartDay
  )
    ? mounted.cycleStartDay
    : null

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
        <input type="hidden" name="userId" value={values.userId} />
        <Select
          id={`${id}-shift-pattern`}
          name="shiftPatternId"
          label="Escala"
          placeholder="Selecione a escala"
          options={shiftPatterns.map(({ id, name }) => ({
            value: id,
            label: name
          }))}
          defaultValue={values.shiftPatternId}
          onValueChange={(value) =>
            setShiftPatternId(value === null ? '' : value)
          }
          error={state.errors?.shiftPatternId}
        />
        <FormField
          id={`${id}-start-date`}
          name="startDate"
          type="date"
          label="Início"
          defaultValue={values.startDate}
          onChange={(event) => setStartDate(event.currentTarget.value)}
          error={state.errors?.startDate}
        />
        {/* The days come from the version in effect, so another version mounts the select again */}
        <Select
          key={versionId}
          id={`${id}-cycle-start-day`}
          name="cycleStartDay"
          label="Dia do ciclo no início"
          placeholder={
            shiftPattern
              ? 'Selecione o dia do ciclo'
              : 'Selecione a escala antes'
          }
          options={cycleDayOptions}
          defaultValue={defaultCycleStartDay}
          onValueChange={(value) =>
            setCycleStartDay(value === null ? '' : value)
          }
          disabled={!shiftPattern}
          error={state.errors?.cycleStartDay}
        />
        <FormField
          id={`${id}-end-date`}
          name="endDate"
          type="date"
          label="Fim (opcional)"
          description="Deixe vazio enquanto o funcionário seguir a escala."
          defaultValue={values.endDate}
          error={state.errors?.endDate}
        />
      </form>
      <SheetFooter className="flex-row justify-end">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
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
