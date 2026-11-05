import { Typography } from '@/app/components/ui/custom/typography'
import { Progress } from '@/app/components/ui/shadcn/progress'
import { TStatusDatabase } from '@/models/status/types'

import { Section } from './section'

export const DatabaseSection = ({ status }: { status: TStatusDatabase }) => {
  type TListItem = {
    label: string
    value: string | number
  }
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
            className="flex flex-col items-center gap-1 rounded-sm bg-accent px-8 py-2 text-center"
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
