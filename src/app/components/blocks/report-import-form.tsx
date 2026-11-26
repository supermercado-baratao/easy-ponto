'use client'

import {
  type ReactNode,
  startTransition,
  useActionState,
  useRef,
  useState
} from 'react'

import { ReportFormatSelect } from '@/app/components/blocks/report-format-select'
import { UnknownCodesDialog } from '@/app/components/blocks/unknown-codes-dialog'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { Input } from '@/app/components/ui/shadcn/input'
import { showActionError } from '@/app/utils/action-error'
import type { TActionError } from '@/entry/action'
import type {
  TCodeResolutions,
  TUnresolvedImport
} from '@/models/synchronization/types'

export type TReportImportState = TActionError & {
  success?: boolean
  unknownCodes?: TUnresolvedImport['unknownCodes']
  types?: TUnresolvedImport['types']
  errors?: Record<string, string>
}

export const ReportImportForm = <TState extends TReportImportState>({
  action,
  onSuccess,
  children
}: {
  action: (state: TState, formData: FormData) => Promise<TState>
  onSuccess: (state: TState) => void
  children: ReactNode
}) => {
  const formReference = useRef<HTMLFormElement>(null)
  const inputReference = useRef<HTMLInputElement>(null)
  const fileReference = useRef<File | null>(null)
  const formatReference = useRef<FormDataEntryValue | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  // Remounts the dialog for each unresolved import, so it never keeps the choices of a cancelled one
  const [dialogKey, setDialogKey] = useState(0)
  const [state, formAction, pending] = useActionState<TState, FormData>(
    async (previousState, formData) => {
      const result = await action(previousState, formData)
      formReference.current?.reset()
      if (result.errors) return result
      if (result.unknownCodes) {
        setDialogKey((key) => key + 1)
        setIsDialogOpen(true)
        return result
      }
      if (result.success) {
        setIsDialogOpen(false)
        onSuccess(result)
      } else if (showActionError(result)) {
        setIsDialogOpen(false)
      }
      return result
    },
    {} as Awaited<TState>
  )

  const submitFile = (formData: FormData): void => {
    fileReference.current = formData.get('file') as File
    formatReference.current = formData.get('format')
    formAction(formData)
  }

  const submitResolutions = (resolutions: TCodeResolutions): void => {
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
          {children}
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
