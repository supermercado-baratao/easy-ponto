import {
  Calendar,
  CalendarDays,
  CalendarSync,
  ChartColumn,
  ClipboardCheck,
  Clock,
  Clock12,
  HelpCircle,
  Hourglass,
  LayoutDashboard,
  LucideIcon,
  Settings,
  TreePalm,
  UserCog,
  Users
} from 'lucide-react'

type TNavItem = {
  section: 'primary' | 'secondary'
  groups: {
    name: string
    items: {
      title: string
      path: string
      icon: LucideIcon
      editOnly?: boolean
    }[]
  }[]
}

export const navItems: TNavItem[] = [
  {
    section: 'primary',
    groups: [
      {
        name: 'Aplicação',
        items: [
          {
            title: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard
          },
          {
            title: 'Registros de Ponto',
            path: '/registros-de-ponto',
            icon: Clock
          },
          {
            title: 'Relatório de Horas',
            path: '/relatorio-de-horas',
            icon: ChartColumn
          },
          {
            title: 'Calendário',
            path: '/calendario',
            icon: Calendar
          },
          {
            title: 'Férias',
            path: '/ferias',
            icon: TreePalm
          }
        ]
      },
      {
        name: 'Cadastro',
        items: [
          {
            title: 'Funcionários',
            path: '/funcionarios',
            icon: Users
          },
          {
            title: 'Escalas',
            path: '/escalas',
            icon: CalendarSync
          },
          {
            title: 'Expedientes',
            path: '/expedientes',
            icon: Clock12
          },
          {
            title: 'Intervalos',
            path: '/intervalos',
            icon: Hourglass
          },
          {
            title: 'Feriados',
            path: '/feriados',
            icon: CalendarDays
          },
          {
            title: 'Tipos de Justificativa',
            path: '/tipos-de-justificativa',
            icon: ClipboardCheck
          }
        ]
      }
    ]
  },
  {
    section: 'secondary',
    groups: [
      {
        name: 'Sistema',
        items: [
          {
            title: 'Membros',
            path: '/membros',
            icon: UserCog,
            editOnly: true
          },
          {
            title: 'Configurações',
            path: '/configuracoes',
            icon: Settings,
            editOnly: true
          },
          {
            title: 'Ajuda',
            path: '/ajuda',
            icon: HelpCircle
          }
        ]
      }
    ]
  }
]
