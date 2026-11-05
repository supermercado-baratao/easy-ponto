'use client'

import { useEffect, useRef } from 'react'
import { useFormState } from 'react-dom'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { Label } from '@/app/components/ui/shadcn/label'
import type { Company, DeviceCredentials } from '@/infra/database/types'

import { importFile } from './actions'
import { TBindParams, TImportFileState } from './types'

type TImportFileButtonProps = {
  company: Company
  credentials: DeviceCredentials
  setCompany: (value: Company) => void
}

export const ImportFileButton = ({
  company,
  credentials,
  setCompany
}: TImportFileButtonProps) => {
  const initialState: TImportFileState = {}

  const params: TBindParams = {
    company,
    credentials
  }

  const [state, formAction, pending] = useFormState(
    importFile.bind(null, params),
    initialState
  )
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success && state.data) {
      toast.success('Arquivo importado com sucesso!')
      setCompany(state.data)
      return
    }

    if (!state.fatalError) {
      return
    }

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
