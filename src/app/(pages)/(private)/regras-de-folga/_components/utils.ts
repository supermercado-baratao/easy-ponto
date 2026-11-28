import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import type { TRestRestrictionWithRelations } from '@/infra/database/types'
import type { TRestRestrictionKind } from '@/models/rest-restriction/utils'
import type { TRestConstraint } from '@/models/rest-rule/utils'

import type { TGroupOption } from './types'

export const CREATE_RULE_BUTTON_ID = 'create-rest-rule'

export const CREATE_RESTRICTION_BUTTON_ID = 'create-rest-restriction'

export const CONSTRAINT_DESCRIPTIONS: Record<TRestConstraint, string> = {
  'same-month':
    'Adia a folga que cai antes da janela e adianta a que cai depois, sem passar para outro mês.',
  'blocked-weekdays': 'A folga movida não cai nos dias da semana marcados.',
  'no-holiday': 'A folga movida não cai num feriado.',
  'same-load':
    'A folga movida cai num dia com a mesma carga do dia trabalhado no lugar dela, como quando a escala muda de versão no mês.'
}

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
