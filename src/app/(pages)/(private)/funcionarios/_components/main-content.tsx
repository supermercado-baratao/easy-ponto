import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { User } from '@/infra/database/types'

import { UsersFilter } from './users-filter'
import { UsersTable } from './users-table'

export const MainContent = ({
  hasCompany,
  users,
  total,
  positions,
  filters
}: {
  hasCompany: boolean
  users: User[]
  total: number
  positions: string[]
  filters: { name: string; position: string | null; status: string | null }
}) => (
  <>
    <Header title="Funcionários" />
    <_MainContent className="flex flex-col gap-6">
      {hasCompany && total > 0 ? (
        <>
          <UsersFilter positions={positions} filters={filters} />
          {users.length > 0 ? (
            <UsersTable users={users} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum funcionário encontrado com esses filtros
            </p>
          )}
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhum funcionário encontrado
          </Typography>
          <Typography component="p" variant="base">
            Importe os funcionários do dispositivo em{' '}
            <Link
              href="/registros-de-ponto"
              className="underline underline-offset-4"
            >
              Registros de Ponto
            </Link>
          </Typography>
        </div>
      )}
    </_MainContent>
  </>
)
