import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { UsersFilter } from '@/app/components/blocks/users-filter'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import type { TScheduleAlertLimits } from '@/models/journey/types'

import { AgendaTable } from './agenda-table'
import type { TAgendaFilters, TAgendaRow } from './types'

export const MainContent = ({
  rows,
  dates,
  total,
  positions,
  filters,
  limits,
  canEdit
}: {
  rows: TAgendaRow[]
  dates: string[]
  total: number
  positions: string[]
  filters: TAgendaFilters
  limits: TScheduleAlertLimits
  canEdit: boolean
}) => (
  <>
    <Header title="Expedientes" />
    <_MainContent className="flex flex-col gap-6">
      {total > 0 ? (
        <>
          <UsersFilter
            path="/expedientes"
            positions={positions}
            filters={filters}
          >
            <div className="grid gap-3">
              <Label htmlFor="horario">Entrada ou saída</Label>
              <Input
                id="horario"
                name="horario"
                type="time"
                defaultValue={filters.time ?? ''}
                className="w-32"
              />
            </div>
          </UsersFilter>
          {rows.length > 0 ? (
            <AgendaTable rows={rows} dates={dates} limits={limits} />
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
          {canEdit && (
            <Typography component="p" variant="base">
              Importe os funcionários do dispositivo em{' '}
              <Link
                href="/registros-de-ponto"
                className="underline underline-offset-4"
              >
                Registros de Ponto
              </Link>
            </Typography>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
