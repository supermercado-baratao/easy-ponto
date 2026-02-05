import { Progress, Typography } from '@/app/components'
import { TStatusDatabase } from '@/models'

import { Section } from './section'

type TListItem = {
  label: string
  value: string | number
}

export const DatabaseSection = ({ status }: { status: TStatusDatabase }) => {
  const items: TListItem[] = [
    {
      label: 'Versão',
      value: status.version
    },
    {
      label: 'Conexões Máximas',
      value: status.maxConnections
    },
    {
      label: 'Conexões Abertas',
      value: status.openedConnections
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
      <Progress value={status.openedConnections} className="mt-2" />
    </Section>
  )
}
