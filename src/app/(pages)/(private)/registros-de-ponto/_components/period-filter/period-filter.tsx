import Form from 'next/form'

import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

export const PeriodFilter = ({
  pis,
  period
}: {
  pis: string
  period: TPunchRecordPeriod
}) => (
  // The key resets the uncontrolled inputs when the period changes through a link or the history
  <Form
    key={`${period.initialDate}|${period.finalDate}`}
    action="/registros-de-ponto"
    aria-label="Período"
    className="flex flex-wrap items-end gap-4"
  >
    <input type="hidden" name="pis" value={pis} />
    <div className="grid gap-2">
      <Label htmlFor="inicio">Início</Label>
      <Input
        id="inicio"
        name="inicio"
        type="date"
        required
        defaultValue={period.initialDate}
      />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="fim">Fim</Label>
      <Input
        id="fim"
        name="fim"
        type="date"
        required
        defaultValue={period.finalDate}
      />
    </div>
    <Button type="submit" variant="outline">
      Filtrar
    </Button>
  </Form>
)
