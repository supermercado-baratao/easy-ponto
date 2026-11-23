'use client'

import { UploadIcon } from 'lucide-react'
import { toast } from 'sonner'

import { ReportImportForm } from '@/app/components/blocks/report-import-form'

import { importFile } from './actions'

const describeSkipped = (count: number): string | undefined => {
  if (count === 0) return
  return count === 1
    ? '1 justificativa não foi importada porque já existe outra no mesmo período.'
    : `${count} justificativas não foram importadas porque já existe outra no mesmo período.`
}

export const ImportFileButton = () => (
  <ReportImportForm
    action={importFile}
    onSuccess={({ skippedJustifications = 0 }) =>
      toast.success('Arquivo importado com sucesso!', {
        description: describeSkipped(skippedJustifications)
      })
    }
  >
    {/* On phones, the header has no room for both the source system select and the button label */}
    <UploadIcon aria-hidden className="sm:hidden" />
    <span className="max-sm:sr-only">Importar Arquivo</span>
  </ReportImportForm>
)
