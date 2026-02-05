import './style.css'

import { DottedMap, Paper, Typography } from '@/app/components'
import { dayjs } from '@/lib'
import { StatusModel } from '@/models'

import { DatabaseSection, Wrapper } from './_components'

const statusModel = new StatusModel()

const Status = async () => {
  const data = await statusModel.check()

  return (
    <Wrapper>
      {data && (
        <>
          <header className="w-full max-w-screen-sm mb-2">
            <Typography component="h1" variant="h4">
              Status do Sistema
            </Typography>
            <Typography component="p" variant="body-small" className="mt-4">
              Atualizado em{' '}
              {dayjs(data.updatedAt).format(
                'DD [de] MMMM [de] YYYY [às] HH:mm:ss'
              )}
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
