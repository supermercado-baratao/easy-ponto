import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import { getWeekdayLabel } from '@/app/utils/weekday'
import type {
  TRestRestrictionWithRelations,
  TRestRuleWithRelations
} from '@/infra/database/types'
import type { TRestRestrictionKind } from '@/models/rest-restriction/utils'
import type {
  THolidayRestPolicy,
  TRestConstraint,
  TRestConstraintLevel
} from '@/models/rest-rule/utils'

import type { TGroupOption } from './types'

export const CREATE_RULE_BUTTON_ID = 'create-rest-rule'

export const CREATE_RESTRICTION_BUTTON_ID = 'create-rest-restriction'

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

export const CONSTRAINT_DESCRIPTIONS: Record<TRestConstraint, string> = {
  'same-month':
    'Adia a folga que cai antes da janela e adianta a que cai depois, sem passar para outro mês.',
  'blocked-weekdays': 'A folga movida não cai nos dias da semana marcados.',
  'no-holiday': 'A folga movida não cai num feriado.',
  'same-load':
    'A folga movida cai num dia com a mesma carga do dia trabalhado no lugar dela, como quando a escala muda de versão no mês.'
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

export const getRestrictionLabel = (
  restriction: TRestRestrictionWithRelations,
  groups: TGroupOption[]
): string =>
  getRestRestrictionLabel({
    kind: restriction.kind as TRestRestrictionKind,
    maxOff: restriction.maxOff,
    weekdays: restriction.weekdays,
    userNames: restriction.user
      ? [restriction.user.name]
      : restriction.users
          .map(({ user }) => user.name)
          .toSorted((a, b) => a.localeCompare(b, 'pt-BR')),
    groupName:
      groups.find(({ id }) => id === restriction.userGroupId)?.label ?? null
  })
