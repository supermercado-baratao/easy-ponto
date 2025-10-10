import { DottedMap, Paper, Progress, Typography } from '@/app/components'
import status from '@/server/models/status'
import { formatDatetime } from '@/shared/utils/datetime'

import { List, Section, TListItem } from './_components'

const Status = async () => {
  const info = await status.check()

  const items: TListItem[] = [
    {
      label: 'Versão',
      value: info.dependencies.database.version
    },
    {
      label: 'Conexões Máximas',
      value: info.dependencies.database.max_connections
    },
    {
      label: 'Conexões Abertas',
      value: info.dependencies.database.opened_connections
    }
  ]

  return (
    <div className="p-4 flex flex-col items-center h-svh w-full">
      <header className="w-full max-w-screen-sm mb-2">
        <Typography component="h1" variant="h4" className="mb-4">
          Status do Sistema
        </Typography>
        <Typography component="p" variant="body-small">
          Atualizado em {formatDatetime(info.updated_at)}
        </Typography>
      </header>
      <main className="lg:relative flex-1 w-full">
        <Paper className="bg-card/90 mt-4 mx-auto max-w-screen-sm">
          <Section title="Banco de Dados">
            <List items={items} />
            <Progress
              value={info.dependencies.database.opened_connections}
              className="mt-2"
            />
          </Section>
        </Paper>
        <DottedMap className="w-full h-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
      </main>
    </div>
  )
}

export default Status
