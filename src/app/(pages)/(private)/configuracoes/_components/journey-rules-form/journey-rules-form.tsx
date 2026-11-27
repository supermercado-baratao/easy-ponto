'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { FormCard, FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { CardContent, CardFooter } from '@/app/components/ui/shadcn/card'
import { showActionError } from '@/app/utils/action-error'
import type { JourneyRules } from '@/infra/database/types'
import { minutesToTime } from '@/infra/time'
import { MAX_TOLERANCE } from '@/models/journey-rules/utils'

import { save } from './actions'
import type { TJourneyRulesFormState, TJourneyRulesFormValues } from './types'

const toFormValues = (rules: JourneyRules): TJourneyRulesFormValues => ({
  punchTolerance: String(rules.punchTolerance),
  dailyTolerance: String(rules.dailyTolerance),
  maxLunch: minutesToTime(rules.maxLunch),
  maxDailyJourney: minutesToTime(rules.maxDailyJourney),
  maxContinuousWork: minutesToTime(rules.maxContinuousWork)
})

export const JourneyRulesForm = ({
  journeyRules
}: {
  journeyRules: JourneyRules
}) => {
  const initialState: TJourneyRulesFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const formReference = useRef<HTMLFormElement>(null)
  const values = state.values ?? toFormValues(journeyRules)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Regras salvas com sucesso!')
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
      title="Regras da jornada"
      description="Os valores começam com os da CLT. Altere-os se a convenção ou o acordo coletivo da empresa prevê outros."
      className="h-fit"
    >
      <CardContent>
        <form
          key={journeyRules.updatedAt.toISOString()}
          ref={formReference}
          id="journey-rules-form"
          className="grid gap-4 sm:grid-cols-2"
          action={formAction}
          noValidate
        >
          <FormField
            name="punchTolerance"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_TOLERANCE}
            label="Tolerância por batida (minutos)"
            description="A diferença em cada batida que não conta como atraso nem como hora extra."
            defaultValue={values.punchTolerance}
            error={state.errors?.punchTolerance}
          />
          <FormField
            name="dailyTolerance"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_TOLERANCE}
            label="Tolerância por dia (minutos)"
            description="A soma das diferenças do dia que não conta como atraso nem como hora extra."
            defaultValue={values.dailyTolerance}
            error={state.errors?.dailyTolerance}
          />
          <FormField
            name="maxLunch"
            type="time"
            label="Pausa máxima"
            description="A página Expedientes avisa quando a pausa passa disso (em horas e minutos, por exemplo 02:00)."
            defaultValue={values.maxLunch}
            error={state.errors?.maxLunch}
          />
          <FormField
            name="maxDailyJourney"
            type="time"
            label="Jornada diária máxima"
            description="A página Expedientes avisa quando a jornada do dia passa disso (em horas e minutos, por exemplo 02:00)."
            defaultValue={values.maxDailyJourney}
            error={state.errors?.maxDailyJourney}
          />
          <FormField
            name="maxContinuousWork"
            type="time"
            label="Tempo máximo sem pausa"
            description="A página Expedientes avisa quando um turno passa disso (em horas e minutos, por exemplo 02:00)."
            defaultValue={values.maxContinuousWork}
            error={state.errors?.maxContinuousWork}
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="journey-rules-form"
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
