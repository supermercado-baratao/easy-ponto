'use client'

import { TriangleAlert } from 'lucide-react'

import { PageMessage } from '@/app/components/blocks/page-message'
import { Button } from '@/app/components/ui/shadcn/button'
import { ERROR_TITLE, getErrorDescription } from '@/app/utils/error-page'

const Error = ({ error, retry }: { error: unknown; retry: () => void }) => (
  <>
    <title>{`${ERROR_TITLE} | Easy Ponto`}</title>
    <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <PageMessage
        icon={TriangleAlert}
        title={ERROR_TITLE}
        description={getErrorDescription(error)}
      >
        <Button onClick={() => retry()}>Tentar novamente</Button>
      </PageMessage>
    </main>
  </>
)

export default Error
