'use client'

import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import { PageMessage } from '@/app/components/blocks/page-message'
import { Button, buttonVariants } from '@/app/components/ui/shadcn/button'
import { ERROR_TITLE, getErrorDescription } from '@/app/utils/error-page'

const Error = ({ error, retry }: { error: unknown; retry: () => void }) => (
  <>
    <title>{`${ERROR_TITLE} | Easy Ponto`}</title>
    <main className="flex min-h-screen bg-background px-4">
      <PageMessage
        icon={TriangleAlert}
        title={ERROR_TITLE}
        description={getErrorDescription(error)}
      >
        <Button onClick={() => retry()}>Tentar novamente</Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Ir para o início
        </Link>
      </PageMessage>
    </main>
  </>
)

export default Error
