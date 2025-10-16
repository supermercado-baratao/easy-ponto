import './style.css'

import { DottedMap, Paper, Typography } from '@/app/components'
import status from '@/server/models/status'
import { formatDatetime } from '@/shared/utils/datetime'

import { DatabaseSection, Wrapper } from './_components'

const Status = async () => {
  const data = await status.check()

  return (
    <Wrapper>
      {data && (
        <>
          <header className="w-full max-w-screen-sm mb-2">
            <Typography component="h1" variant="h4">
              Status do Sistema
            </Typography>
            <Typography component="p" variant="body-small" className="mt-4">
              Atualizado em {formatDatetime(data.updated_at)}
            </Typography>
          </header>
          <main className="lg:relative flex-1 w-full">
            <Paper className="bg-card/90 mt-4 mx-auto max-w-screen-sm">
              <DatabaseSection status={data.dependencies.database} />
            </Paper>
            <DottedMap className="dotted-map" />
          </main>
        </>
      )}
    </Wrapper>
  )
}

export default Status
