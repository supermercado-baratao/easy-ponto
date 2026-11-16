import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { JustificationType } from '@/infra/database/types'
import type { TVacationPlanRow } from '@/models/vacation-plan/types'
import { getMonthPeriod } from '@/models/vacation-plan/utils'

import { PlanSheet } from './plan-sheet/plan-sheet'
import { RegisterSheet } from './register-sheet/register-sheet'
import { formatDate, getMonthLabel } from './utils'

const VacationStatus = ({ plan }: Pick<TVacationPlanRow, 'plan'>) => {
  if (!plan) {
    return <span className="text-muted-foreground">Sem planejamento</span>
  }
  if (!plan.justification) return <>Planejadas</>

  const { startDate, endDate, type } = plan.justification
  return (
    <>
      Registradas ({type.code}): {formatDate(startDate)} a {formatDate(endDate)}
    </>
  )
}

export const VacationPlansTable = ({
  year,
  rows,
  types
}: {
  year: number
  rows: TVacationPlanRow[]
  types: JustificationType[]
}) => (
  <Table aria-label={`Planejamento das férias de ${year}`}>
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        <TableHead>Cargo</TableHead>
        <TableHead>Mês</TableHead>
        <TableHead>Férias</TableHead>
        <TableHead>
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ user, plan }) => {
        const planTriggerId = `plan-trigger-${user.id}`
        return (
          <TableRow key={user.id}>
            <TableHead scope="row" className="font-normal">
              {user.name}
            </TableHead>
            <TableCell>{user.position ?? '—'}</TableCell>
            <TableCell>{plan ? getMonthLabel(plan.month) : '—'}</TableCell>
            <TableCell>
              <VacationStatus plan={plan} />
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                {plan && (
                  <RegisterSheet
                    focusAfterRegisterId={planTriggerId}
                    registered={!!plan.justification}
                    userName={user.name}
                    types={types}
                    defaultValues={{
                      userId: user.id,
                      year: String(year),
                      ...getMonthPeriod(year, plan.month)
                    }}
                  />
                )}
                <PlanSheet
                  triggerId={planTriggerId}
                  userName={user.name}
                  year={year}
                  registered={!!plan?.justification}
                  defaultValues={{
                    userId: user.id,
                    year: String(year),
                    month: plan ? String(plan.month) : undefined
                  }}
                />
              </div>
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
