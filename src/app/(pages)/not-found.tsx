import { FileQuestion } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { PageMessage } from '@/app/components/blocks/page-message'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { NOT_FOUND_DESCRIPTION, NOT_FOUND_TITLE } from '@/app/utils/error-page'

export const metadata: Metadata = { title: `${NOT_FOUND_TITLE} | Easy Ponto` }

const NotFound = () => (
  <main className="flex min-h-screen bg-background px-4">
    <PageMessage
      icon={FileQuestion}
      title={NOT_FOUND_TITLE}
      description={NOT_FOUND_DESCRIPTION}
    >
      <Link href="/" className={buttonVariants()}>
        Ir para o início
      </Link>
    </PageMessage>
  </main>
)

export default NotFound
