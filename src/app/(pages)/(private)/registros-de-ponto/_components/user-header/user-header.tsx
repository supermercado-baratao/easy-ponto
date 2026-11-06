import { cn } from 'cn'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'
import type { User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import { getPunchRecordsHref } from '../utils'
import { UserSelect } from './user-select'

const NavigationLink = ({
  user,
  period,
  label,
  children
}: {
  user: User | undefined
  period: TPunchRecordPeriod
  label: string
  children: React.ReactNode
}) => {
  // `cn` resolves `border-transparent` against `border-border`, as `Button` does, or the link loses its border
  const className = cn(buttonVariants({ variant: 'outline', size: 'icon' }))

  if (!user) {
    return (
      <span
        aria-disabled="true"
        aria-label={label}
        role="link"
        className={cn(className, 'pointer-events-none opacity-50')}
      >
        {children}
      </span>
    )
  }

  return (
    <Link
      href={getPunchRecordsHref({ pis: user.pis, ...period })}
      aria-label={`${label}: ${user.name}`}
      className={className}
    >
      {children}
    </Link>
  )
}

export const UserHeader = ({
  users,
  user,
  period
}: {
  users: User[]
  user: User
  period: TPunchRecordPeriod
}) => {
  const index = users.findIndex(({ pis }) => pis === user.pis)
  const options = users.map(({ pis, name }) => ({ value: pis, label: name }))

  const details = [
    { label: 'PIS', value: user.pis },
    { label: 'Matrícula', value: user.registration || undefined },
    { label: 'Cargo', value: user.position || undefined },
    { label: 'Departamento', value: user.department || undefined },
    {
      label: 'Admissão',
      value: user.admissionDate
        ? dayjs(user.admissionDate).format('DD/MM/YYYY')
        : undefined
    }
  ]

  return (
    <section aria-labelledby="employee-name" className="flex flex-col gap-4">
      <h2 id="employee-name" className="sr-only">
        {user.name}
      </h2>
      <div className="flex items-center gap-2">
        <NavigationLink
          user={users[index - 1]}
          period={period}
          label="Funcionário anterior"
        >
          <ChevronLeftIcon />
        </NavigationLink>
        <UserSelect options={options} pis={user.pis} period={period} />
        <NavigationLink
          user={users[index + 1]}
          period={period}
          label="Próximo funcionário"
        >
          <ChevronRightIcon />
        </NavigationLink>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-5">
        {details.map(({ label, value = '—' }) => (
          <div key={label}>
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
