'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'

import { importFile } from './actions'
import { TImportFileState } from './types'

export const ImportFileButton = () => {
  const initialState: TImportFileState = {}
  const [state, formAction, pending] = useActionState(importFile, initialState)
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Arquivo importado com sucesso!')
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state])

  return (
    <>
      <form action={formAction} ref={formReference}>
        <Label htmlFor="file" className="cursor-pointer">
          <Button variant="outline" nativeButton={false} render={<span />}>
            Importar Arquivo
          </Button>
        </Label>
        <Input
          id="file"
          type="file"
          name="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          onChange={() => formReference.current?.requestSubmit()}
        />
      </form>
      <Loader open={pending} />
    </>
  )
}
