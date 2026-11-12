import {
  Calendar,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Clock12,
  HelpCircle,
  Hourglass,
  LayoutDashboard,
  LucideIcon,
  Settings,
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
            title: 'Calendário',
            path: '/calendario',
            icon: Calendar
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
            title: 'Configurações',
            path: '/configuracoes',
            icon: Settings
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
