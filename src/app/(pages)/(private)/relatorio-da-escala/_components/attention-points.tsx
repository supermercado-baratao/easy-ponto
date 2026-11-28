import { CircleAlert } from 'lucide-react'

import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/app/components/ui/shadcn/alert'
import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import type { TAttentionPoint } from '@/models/schedule-report/utils'

import { formatDate, formatMonth } from './utils'

const getText = (point: TAttentionPoint, canEdit: boolean): string => {
  switch (point.kind) {
    case 'outdated-month': {
      return `As folgas de ${formatMonth(point.month).toLowerCase()} não foram geradas com as regras atuais: o relatório mostra o que a geração salvaria.${canEdit ? ' Gere as folgas do mês em Regras de Folga.' : ''}`
    }
    case 'unmoved-rest': {
      return `A folga de ${point.userName} em ${formatDate(point.date)} (${point.ruleName}) não tem um dia que cumpra as restrições obrigatórias.`
    }
    case 'required-restriction-break': {
      return `${formatDate(point.date)}: a folga da escala quebra a restrição obrigatória "${getRestRestrictionLabel(point.restriction)}".`
    }
    case 'single-member-group': {
      return `O grupo ${point.groupName} tem uma só pessoa na escala, então fica sem ninguém nas folgas dela.`
    }
    case 'without-schedule': {
      return `${point.userName} não tem escala no período e fica fora do relatório.`
    }
  }
}

export const AttentionPoints = ({
  points,
  canEdit
}: {
  points: TAttentionPoint[]
  canEdit: boolean
}) => (
  <Alert>
    <CircleAlert aria-hidden="true" />
    <AlertTitle>Pontos de atenção</AlertTitle>
    <AlertDescription>
      <ul className="flex list-disc flex-col gap-1 pl-4">
        {points.map((point, index) => (
          <li key={index}>{getText(point, canEdit)}</li>
        ))}
      </ul>
    </AlertDescription>
  </Alert>
)
