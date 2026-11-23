'use client'

import { UploadIcon } from 'lucide-react'
import { startTransition, useActionState, useRef, useState } from 'react'
import { toast } from 'sonner'

import { ReportFormatSelect } from '@/app/components/blocks/report-format-select'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { showActionError } from '@/app/utils/action-error'
import type { TCodeResolution } from '@/models/synchronization/types'

import { importFile } from './actions'
import { TImportFileState } from './types'
import { UnknownCodesDialog } from './unknown-codes-dialog'

const describeSkipped = (count: number): string | undefined => {
  if (count === 0) return
  return count === 1
    ? '1 justificativa não foi importada porque já existe outra no mesmo período.'
    : `${count} justificativas não foram importadas porque já existe outra no mesmo período.`
}

export const ImportFileButton = () => {
  const formReference = useRef<HTMLFormElement>(null)
  const inputReference = useRef<HTMLInputElement>(null)
  const fileReference = useRef<File | null>(null)
  const formatReference = useRef<FormDataEntryValue | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Remounts the dialog for each unresolved import, so it never keeps the choices of a cancelled one
  const [dialogKey, setDialogKey] = useState(0)
  const initialState: TImportFileState = {}
  const [state, formAction, pending] = useActionState(
    async (
      previousState: TImportFileState,
      formData: FormData
    ): Promise<TImportFileState> => {
      const result = await importFile(previousState, formData)
      formReference.current?.reset()
      if (result.errors) return result
      if (result.unknownCodes) {
        setDialogKey((key) => key + 1)
        setIsDialogOpen(true)
        return result
      }
      if (result.success) {
        setIsDialogOpen(false)
        toast.success('Arquivo importado com sucesso!', {
          description: describeSkipped(result.skippedJustifications ?? 0)
        })
      } else if (showActionError(result)) {
        setIsDialogOpen(false)
      }
      return result
    },
    initialState
  )

  const submitFile = (formData: FormData): void => {
    fileReference.current = formData.get('file') as File
    formatReference.current = formData.get('format')
    formAction(formData)
  }

  const submitResolutions = (
    resolutions: Record<string, Partial<TCodeResolution>>
  ): void => {
    if (!fileReference.current || !formatReference.current) return
    const formData = new FormData()
    formData.set('file', fileReference.current)
    formData.set('format', formatReference.current)
    formData.set('resolutions', JSON.stringify(resolutions))
    startTransition(() => formAction(formData))
  }

  return (
    <>
      <form
        action={submitFile}
        ref={formReference}
        className="flex items-center gap-2"
      >
        <ReportFormatSelect disabled={pending} />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          focusableWhenDisabled
          onClick={() => inputReference.current?.click()}
        >
          {/* On phones, the header has no room for both the source system select and the button label */}
          <UploadIcon aria-hidden className="sm:hidden" />
          <span className="max-sm:sr-only">Importar Arquivo</span>
        </Button>
        <Input
          ref={inputReference}
          type="file"
          name="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          disabled={pending}
          onChange={() => formReference.current?.requestSubmit()}
        />
      </form>
      {state.unknownCodes && (
        <UnknownCodesDialog
          key={dialogKey}
          open={isDialogOpen}
          codes={state.unknownCodes}
          types={state.types ?? []}
          errors={state.errors}
          pending={pending}
          onSubmit={submitResolutions}
          onCancel={() => setIsDialogOpen(false)}
        />
      )}
      <Loader open={pending && !isDialogOpen} />
    </>
  )
}
