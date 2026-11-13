'use client'

import { useActionState, useId, useRef } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'

import { importFile } from './actions'
import { TImportFileState } from './types'

export const ImportFileButton = () => {
  const inputId = useId()
  const formReference = useRef<HTMLFormElement>(null)
  const initialState: TImportFileState = {}
  const [, formAction, pending] = useActionState(
    async (
      previousState: TImportFileState,
      formData: FormData
    ): Promise<TImportFileState> => {
      const result = await importFile(previousState, formData)
      formReference.current?.reset()
      if (result.success) {
        toast.success('Arquivo importado com sucesso!')
      } else if (result.message) {
        toast.error(result.message, { description: result.action })
      } else {
        toast.error('Um erro inesperado aconteceu!', {
          description: 'Atualize a página e tente novamente.'
        })
      }
      return result
    },
    initialState
  )

  return (
    <>
      <form action={formAction} ref={formReference}>
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
      <Loader open={pending} />
    </>
  )
}
