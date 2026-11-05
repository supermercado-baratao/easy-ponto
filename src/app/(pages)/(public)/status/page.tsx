import './style.css'

import { Paper } from '@/app/components/ui/custom/paper'
import { Typography } from '@/app/components/ui/custom/typography'
import { DottedMap } from '@/app/components/ui/magic-ui/dotted-map'
import { dayjs } from '@/lib/dayjs'
import { statusModel } from '@/models/status/model'

import { DatabaseSection } from './_components/database-section'
import { Wrapper } from './_components/wrapper'

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
