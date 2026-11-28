import { COMPANY_SETUP_STEP_LABELS } from '@/app/utils/company-setup'
import { getAlertLabel } from '@/app/utils/schedule-alert'
import { dayjs } from '@/infra/dayjs'
import type { TScheduleAlertLimits } from '@/models/journey/types'
import { SCHEDULE_AGENDA_DAYS } from '@/models/journey/utils'
import type {
  TPendingItem,
  TPendingItemType
} from '@/models/pending-item/types'

export const PENDING_ITEM_GROUPS: Record<
  TPendingItemType,
  { title: string; description: string }
> = {
  'company-setup': {
    title: 'Configuração da empresa',
    description: 'O que falta para o Easy Ponto calcular a jornada.'
  },
  'user-without-schedule': {
    title: 'Funcionários sem escala',
    description:
      'Funcionários ativos sem nenhuma escala em vigor hoje: os dias deles não são calculados.'
  },
  'schedule-alert': {
    title: 'Alertas da escala',
    description: `Dias de hoje até daqui a ${SCHEDULE_AGENDA_DAYS - 1} dias em que a escala passa dos limites das regras da jornada.`
  },
  'unmoved-rest': {
    title: 'Folgas não movidas',
    description:
      'Folgas da escala, de hoje até o fim do próximo mês, que as regras de folga mandam mover e ainda não têm um ajuste do dia.'
  }
}

export const getPendingItemLabel = (
  item: TPendingItem,
  limits: TScheduleAlertLimits
): { title: string; description: string | null } => {
  switch (item.type) {
    case 'company-setup': {
      return { title: COMPANY_SETUP_STEP_LABELS[item.step], description: null }
    }
    case 'user-without-schedule': {
      return {
        title: item.user.name,
        description: 'Sem escala em vigor hoje'
      }
    }
    case 'schedule-alert': {
      const day = dayjs(item.date)
      return {
        title: item.user.name,
        description: `${day.format('ddd, DD/MM')} · ${getAlertLabel(item.alert, limits)}`
      }
    }
    case 'unmoved-rest': {
      return {
        title: item.user.name,
        description: `${dayjs(item.date).format('ddd, DD/MM')} · ${item.ruleName}`
      }
    }
  }
}

const withName = (path: string, name: string): string =>
  `${path}?${new URLSearchParams({ nome: name }).toString()}`

export const getResolvePath = (item: TPendingItem): string => {
  switch (item.type) {
    case 'company-setup': {
      return '/configuracoes'
    }
    case 'user-without-schedule': {
      return withName('/funcionarios', item.user.name)
    }
    case 'schedule-alert': {
      return withName('/expedientes', item.user.name)
    }
    case 'unmoved-rest': {
      return `/calendario?${new URLSearchParams({ mes: item.date.slice(0, 7), funcionario: item.user.id }).toString()}`
    }
  }
}

export const groupPendingItems = <T extends TPendingItem>(
  items: T[]
): { type: TPendingItemType; items: T[] }[] =>
  [...new Set(items.map(({ type }) => type))].map((type) => ({
    type,
    items: items.filter((item) => item.type === type)
  }))
