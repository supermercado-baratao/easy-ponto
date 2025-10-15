import { Progress, Typography } from '@/app/components'
import { TDatabaseStatus } from '@/shared/types/status'

import { Section } from './section'

type TListItem = {
  label: string
  value: string | number
}

export const DatabaseSection = ({ status }: { status: TDatabaseStatus }) => {
  const items: TListItem[] = [
    {
      label: 'Versão',
      value: status.version
    },
    {
      label: 'Conexões Máximas',
      value: status.max_connections
    },
    {
      label: 'Conexões Abertas',
      value: status.opened_connections
    }
  ]

  return (
    <Section title="Banco de Dados">
      <ul className="grid grid-cols-3 gap-2">
        {items.map((item) => (
          <li
            key={item.label}
            className="bg-accent rounded-sm py-2 px-8 flex flex-col text-center items-center gap-1"
          >
            <Typography component="strong" variant="caption">
              {item.label}
            </Typography>
            {item.value}
          </li>
        ))}
      </ul>
      <Progress value={status.opened_connections} className="mt-2" />
    </Section>
  )
}
