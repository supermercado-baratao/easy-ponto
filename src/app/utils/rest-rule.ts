import type { TRestRuleWithRelations } from '@/infra/database/types'
import type {
  THolidayRestPolicy,
  TRestConstraint,
  TRestConstraintLevel
} from '@/models/rest-rule/utils'

import { getWeekdayLabel } from './weekday'

export const HOLIDAY_REST_LABELS: Record<THolidayRestPolicy, string> = {
  always: 'Sempre conta como folga',
  window: 'Só conta dentro da janela',
  never: 'Nunca conta como folga'
}

export const CONSTRAINT_LABELS: Record<TRestConstraint, string> = {
  'same-month': 'Manter no mesmo mês',
  'blocked-weekdays': 'Dias da semana bloqueados',
  'no-holiday': 'Nunca lançar em feriado',
  'same-load': 'Mesma carga do dia trabalhado'
}

export const LEVEL_LABELS: Record<TRestConstraintLevel, string> = {
  required: 'Obrigatória',
  preferred: 'Preferencial'
}

export const getConstraintSummary = (
  rule: Pick<TRestRuleWithRelations, 'constraints' | 'blockedWeekdays'>
): string[] =>
  rule.constraints
    .toSorted(
      (a, b) =>
        Number(a.level === 'preferred') - Number(b.level === 'preferred') ||
        (a.position ?? 0) - (b.position ?? 0)
    )
    .map(({ constraint, level, position }) => {
      const name = CONSTRAINT_LABELS[constraint as TRestConstraint]
      const detail =
        constraint === 'blocked-weekdays'
          ? ` (${rule.blockedWeekdays.map((weekday) => getWeekdayLabel(weekday)).join(', ')})`
          : ''
      const levelLabel =
        level === 'preferred'
          ? `Preferencial ${position}`
          : LEVEL_LABELS.required
      return `${levelLabel}: ${name}${detail}`
    })
