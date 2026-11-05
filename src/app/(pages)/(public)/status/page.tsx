import './style.css'

import { Paper } from '@/app/components/ui/custom/paper'
import { Typography } from '@/app/components/ui/custom/typography'
import { DottedMap } from '@/app/components/ui/magic-ui/dotted-map'
import { dayjs } from '@/infra/dayjs'

import { DatabaseSection } from './_components/database-section'
import { Wrapper } from './_components/wrapper'
import { getStatus } from './data'

const Status = async () => {
  const data = await getStatus()

  return (
    <Wrapper>
      {data && (
        <>
          <header className="mb-2 w-full max-w-screen-sm">
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
          <main className="w-full flex-1 lg:relative">
            <Paper className="mx-auto mt-4 max-w-screen-sm bg-card/90">
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
