import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'

import { JobFunctionSheet } from './job-function-sheet/job-function-sheet'
import { RemoveJobFunctionButton } from './remove-job-function-button/remove-job-function-button'
import type { TJobFunctionRow } from './types'

export const JobFunctionsTable = ({
  rows,
  canEdit
}: {
  rows: TJobFunctionRow[]
  canEdit: boolean
}) => (
  <Table aria-label="Funções">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead className="text-right">Nível</TableHead>
        <TableHead className="text-right">Exercem</TableHead>
        <TableHead className="text-right">Com a função inativa</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ jobFunction, active, inactive }) => (
        <TableRow key={jobFunction.id}>
          <TableHead scope="row" className="font-normal whitespace-normal">
            <span className="block">{jobFunction.name}</span>
            {jobFunction.description && (
              <span className="block text-muted-foreground">
                {jobFunction.description}
              </span>
            )}
          </TableHead>
          <TableCell className="text-right tabular-nums">
            {jobFunction.level}
          </TableCell>
          <TableCell className="text-right tabular-nums">{active}</TableCell>
          <TableCell className="text-right tabular-nums">{inactive}</TableCell>
          {canEdit && (
            <TableCell>
              <div className="flex justify-end gap-1">
                <JobFunctionSheet
                  jobFunction={jobFunction}
                  defaultValues={{
                    id: jobFunction.id,
                    name: jobFunction.name,
                    description: jobFunction.description ?? '',
                    level: String(jobFunction.level)
                  }}
                />
                <RemoveJobFunctionButton jobFunction={jobFunction} />
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
