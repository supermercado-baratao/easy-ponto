import type {
  TRestRestrictionKind,
  TRestRestrictionSummary
} from '@/models/rest-restriction/utils'

import { getWeekdayLabel } from './weekday'

export const REST_RESTRICTION_KIND_LABELS: Record<
  TRestRestrictionKind,
  string
> = {
  together: 'Não folgam juntos',
  group: 'Limite do grupo',
  weekdays: 'Dias proibidos'
}

const listFormat = new Intl.ListFormat('pt-BR', {
  style: 'long',
  type: 'conjunction'
})

const getMaxOffLabel = (maxOff: number | null): string =>
  `no máximo ${maxOff} de folga no mesmo dia`

export const getRestRestrictionLabel = ({
  kind,
  maxOff,
  weekdays,
  userNames,
  groupName
}: Pick<
  TRestRestrictionSummary,
  'kind' | 'maxOff' | 'weekdays' | 'userNames' | 'groupName'
>): string => {
  switch (kind) {
    case 'together': {
      return `${listFormat.format(userNames)}: ${getMaxOffLabel(maxOff)}`
    }
    case 'group': {
      return `Grupo ${groupName}: ${getMaxOffLabel(maxOff)}`
    }
    case 'weekdays': {
      const days = weekdays.map((weekday) =>
        getWeekdayLabel(weekday).toLowerCase()
      )
      return `${userNames[0]} não pode folgar: ${listFormat.format(days)}`
    }
  }
}
