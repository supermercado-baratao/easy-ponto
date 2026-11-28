'use client'

import { useActionState, useId, useState } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/app/components/ui/shadcn/dialog'
import { showActionError } from '@/app/utils/action-error'

import { generateRests, previewRests } from './actions'
import { PreviewTable } from './preview-table'
import type { TGenerateRestsState, TPreviewRestsState } from './types'

const countLabel = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`

const getSummary = (moved: number, unmoved: number): string =>
  moved + unmoved === 0
    ? 'Nenhuma folga a mover neste mês.'
    : `${countLabel(moved, 'folga movida', 'folgas movidas')} e ${countLabel(unmoved, 'não movida', 'não movidas')}.`

// Rendered inside the popup, which unmounts on close, so each opening starts without a preview
const GenerateRestsContent = ({
  defaultMonth,
  onSaved
}: {
  defaultMonth: string
  onSaved: () => void
}) => {
  const id = useId()
  const [month, setMonth] = useState(defaultMonth)
  const [previewState, previewAction, previewPending] = useActionState(
    async (
      previousState: TPreviewRestsState,
      formData: FormData
    ): Promise<TPreviewRestsState> => {
      const result = await previewRests(previousState, formData)
      if (!result.success && !result.errors) showActionError(result)
      return result
    },
    {}
  )
  const [, generateAction, generatePending] = useActionState(
    async (
      previousState: TGenerateRestsState,
      formData: FormData
    ): Promise<TGenerateRestsState> => {
      const result = await generateRests(previousState, formData)
      if (result.success && result.data) {
        const { moved, unmoved } = result.data
        toast.success(
          unmoved > 0
            ? `${countLabel(moved, 'folga movida', 'folgas movidas')}. ${countLabel(unmoved, 'folga não pôde ser movida e está', 'folgas não puderam ser movidas e estão')} nas pendências.`
            : `${countLabel(moved, 'folga movida', 'folgas movidas')} com sucesso!`
        )
        onSaved()
      } else {
        showActionError(result)
      }
      return result
    },
    {}
  )
  // A preview of another month than the one in the field would save the wrong month
  const preview = previewState.month === month ? previewState.data : null
  const moved = preview?.moves.filter(({ target }) => target).length ?? 0
  const unmoved = (preview?.moves.length ?? 0) - moved

  return (
    <>
      <DialogHeader>
        <DialogTitle>Gerar folgas</DialogTitle>
        <DialogDescription>
          Move as folgas do mês de todos os funcionários pelas regras de folga e
          salva cada mudança como um ajuste do dia. Gerar de novo substitui só o
          que as regras geraram: os ajustes feitos à mão no Calendário continuam
          valendo.
        </DialogDescription>
      </DialogHeader>
      <form
        action={previewAction}
        noValidate
        className="flex flex-wrap items-end gap-3"
      >
        <FormField
          id={`${id}-month`}
          name="month"
          type="month"
          label="Mês"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          error={
            previewState.month === month
              ? previewState.errors?.month
              : undefined
          }
          className="w-44"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={previewPending}
          focusableWhenDisabled
        >
          {previewPending ? (
            <Loader mode="inline" label="Ver prévia" />
          ) : (
            'Ver prévia'
          )}
        </Button>
      </form>
      <div className="-mx-4 flex flex-col gap-3 overflow-y-auto px-4">
        <p aria-live="polite" className="text-sm">
          {preview ? getSummary(moved, unmoved) : ''}
        </p>
        {preview && preview.moves.length > 0 && (
          <PreviewTable moves={preview.moves} />
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          Cancelar
        </DialogClose>
        {preview && (
          <form action={generateAction}>
            <input type="hidden" name="month" value={month} />
            <Button
              type="submit"
              disabled={generatePending}
              focusableWhenDisabled
              className="w-full"
            >
              {generatePending ? (
                <Loader mode="inline" label="Salvar folgas" />
              ) : (
                'Salvar folgas'
              )}
            </Button>
          </form>
        )}
      </DialogFooter>
    </>
  )
}

export const GenerateRestsDialog = ({
  defaultMonth
}: {
  defaultMonth: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Gerar folgas
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] grid-rows-[auto_auto_1fr_auto] sm:max-w-3xl">
        <GenerateRestsContent
          defaultMonth={defaultMonth}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
