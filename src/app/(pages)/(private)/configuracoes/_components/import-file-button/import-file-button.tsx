'use client'

import { startTransition, useActionState, useId, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
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
  const inputId = useId()
  const formReference = useRef<HTMLFormElement>(null)
  const fileReference = useRef<File | null>(null)
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
      } else if (result.message) {
        setIsDialogOpen(false)
        toast.error(result.message, { description: result.action })
      } else if (result.fatalError) {
        setIsDialogOpen(false)
        toast.error('Um erro inesperado aconteceu!', {
          description: 'Atualize a página e tente novamente.'
        })
      }
      return result
    },
    initialState
  )

  const submitFile = (formData: FormData): void => {
    fileReference.current = formData.get('file') as File
    formAction(formData)
  }

  const submitResolutions = (
    resolutions: Record<string, Partial<TCodeResolution>>
  ): void => {
    if (!fileReference.current) return
    const formData = new FormData()
    formData.set('file', fileReference.current)
    formData.set('resolutions', JSON.stringify(resolutions))
    startTransition(() => formAction(formData))
  }

  return (
    <>
      <form action={submitFile} ref={formReference}>
        <Label htmlFor={inputId} className="cursor-pointer">
          <Button
            variant="outline"
            nativeButton={false}
            render={<span />}
            disabled={pending}
            focusableWhenDisabled
          >
            Importar Arquivo
          </Button>
        </Label>
        <Input
          id={inputId}
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
