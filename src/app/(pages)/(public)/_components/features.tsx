import {
  Calendar,
  ChartColumn,
  Clock,
  Clock12,
  FileSpreadsheet,
  type LucideIcon,
  RefreshCw,
  TreePalm,
  Users
} from 'lucide-react'

type TFeature = {
  title: string
  description: string
  icon: LucideIcon
}

const features: TFeature[] = [
  {
    title: 'Sincronização com o relógio',
    description:
      'Traz do relógio Control iD a empresa, os funcionários e as batidas, lidas do AFD da Portaria 671.',
    icon: RefreshCw
  },
  {
    title: 'Registros de ponto',
    description:
      'As batidas de cada funcionário por período, incluindo as lançadas à mão.',
    icon: Clock
  },
  {
    title: 'Relatório e banco de horas',
    description:
      'Horas previstas e trabalhadas, faltas, atrasos e horas extras de 60% e 100%, com o fechamento de cada período.',
    icon: ChartColumn
  },
  {
    title: 'Expedientes',
    description:
      'O horário de cada funcionário, com alerta de almoço acima de 2h, jornada acima de 8h e mais de 6h sem intervalo.',
    icon: Clock12
  },
  {
    title: 'Funcionários',
    description:
      'Setor, cargo, admissão e situação de cada funcionário, em uma lista com filtros.',
    icon: Users
  },
  {
    title: 'Férias',
    description:
      'O mês de férias planejado para cada funcionário e o registro das férias tiradas.',
    icon: TreePalm
  },
  {
    title: 'Calendário de carga',
    description:
      'A carga prevista de cada dia do mês, sem carga nos domingos e feriados, com o total de cada semana.',
    icon: Calendar
  },
  {
    title: 'Migração do Secullum',
    description:
      'Importa o relatório Cartão Ponto com os horários, as justificativas e o saldo inicial do banco de horas.',
    icon: FileSpreadsheet
  }
]

export const Features = () => {
  return (
    <section aria-labelledby="features-heading" className="flex flex-col gap-8">
      <div className="flex max-w-xl flex-col gap-2">
        <h2
          id="features-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          O que o Easy Ponto faz
        </h2>
        <p className="text-muted-foreground">
          Do registro no relógio ao saldo de cada funcionário, sem planilha no
          meio do caminho.
        </p>
      </div>
      <ul
        role="list"
        className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map(({ title, description, icon: Icon }) => (
          <li key={title} className="flex flex-col gap-2 border-t pt-4">
            <Icon aria-hidden className="size-5 text-muted-foreground" />
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
