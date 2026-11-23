'use client'

import { TriangleAlert } from 'lucide-react'

import { Header } from '@/app/components/blocks/header'
import { PageMessage } from '@/app/components/blocks/page-message'
import { MainContent } from '@/app/components/ui/custom/main-content'
import { Button } from '@/app/components/ui/shadcn/button'
import { ERROR_TITLE, getErrorDescription } from '@/app/utils/error-page'

const Error = ({ error, retry }: { error: unknown; retry: () => void }) => (
  <>
    <title>{`${ERROR_TITLE} | Easy Ponto`}</title>
    <Header title="Erro" />
    <MainContent className="flex flex-1">
      <PageMessage
        icon={TriangleAlert}
        title={ERROR_TITLE}
        titleAs="h2"
        description={getErrorDescription(error)}
      >
        <Button onClick={() => retry()}>Tentar novamente</Button>
      </PageMessage>
    </MainContent>
  </>
)

export default Error
