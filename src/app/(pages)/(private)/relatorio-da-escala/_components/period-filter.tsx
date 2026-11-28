import Form from 'next/form'

import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import type { TScheduleReportPeriod } from '@/models/schedule-report/types'

import type { TReportVersion } from './types'
import { getVersionParameter, SCHEDULE_REPORT_PATH } from './utils'

export const PeriodFilter = ({
  period,
  version
}: {
  period: TScheduleReportPeriod
  version: TReportVersion
}) => {
  const versionParameter = getVersionParameter(version)
  return (
    // The key resets the uncontrolled inputs when the period changes through a link or the history
    <Form
      key={`${period.initialMonth}|${period.finalMonth}|${period.limit}`}
      action={SCHEDULE_REPORT_PATH}
      role="search"
      aria-label="Período"
      className="flex flex-wrap items-end gap-4 print:hidden"
    >
      {versionParameter && (
        <input type="hidden" name="versao" value={versionParameter} />
      )}
      <div className="grid gap-2">
        <Label htmlFor="de">Mês inicial</Label>
        <Input
          id="de"
          name="de"
          type="month"
          required
          placeholder="aaaa-mm"
          defaultValue={period.initialMonth}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ate">Mês final</Label>
        <Input
          id="ate"
          name="ate"
          type="month"
          required
          placeholder="aaaa-mm"
          defaultValue={period.finalMonth}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="limite">Limite de folgas por dia</Label>
        <Input
          id="limite"
          name="limite"
          type="number"
          min={0}
          inputMode="numeric"
          className="w-40"
          defaultValue={period.limit ?? ''}
        />
      </div>
      <Button type="submit" variant="outline">
        Filtrar
      </Button>
    </Form>
  )
}
