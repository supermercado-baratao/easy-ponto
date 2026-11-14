'use client'

import { useRouter } from 'next/navigation'
import { useActionState, useId, useState } from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/app/components/ui/shadcn/alert-dialog'
import { Button } from '@/app/components/ui/shadcn/button'
import type { THoursBankReport } from '@/models/hours-bank/types'

import { ImportInitialBalanceButton } from '../initial-balance/import-initial-balance-button'
import { formatDate, formatPeriod, getHoursReportHref } from '../utils'
import { closePeriod, reopenPeriod } from './actions'
import type { TClosingState } from './types'

const ClosingDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  successMessage,
  fields,
  action,
  onSuccess,
  disabled,
  describedBy
}: {
  trigger: string
  title: string
  description: string
  confirmLabel: string
  successMessage: string
  fields: Record<string, string>
  action: (state: TClosingState, formData: FormData) => Promise<TClosingState>
  onSuccess?: () => void
  disabled?: boolean
  describedBy?: string
}) => {
  const initialState: TClosingState = {}
  const [open, setOpen] = useState(false)
  const [, formAction, pending] = useActionState(
    async (
      previousState: TClosingState,
      formData: FormData
    ): Promise<TClosingState> => {
      const result = await action(previousState, formData)
      if (result.success) {
        toast.success(successMessage)
        setOpen(false)
        onSuccess?.()
      } else if (result.message) {
        toast.error(result.message, { description: result.action })
        setOpen(false)
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={disabled}
        render={<Button variant="outline" aria-describedby={describedBy} />}
      >
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            {Object.entries(fields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Button
              type="submit"
              disabled={pending}
              focusableWhenDisabled
              className="w-full"
            >
              {pending ? (
                <Loader mode="inline" label={confirmLabel} />
              ) : (
                confirmLabel
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const ClosingSection = ({
  report
}: {
  report: Pick<
    THoursBankReport,
    'period' | 'order' | 'closing' | 'lastClosing' | 'closeIssue'
  >
}) => {
  const router = useRouter()
  const issueId = useId()
  const { period, order, closing, lastClosing, closeIssue } = report

  if (closing) {
    return (
      <section
        aria-label="Fechamento"
        className="flex flex-wrap items-center gap-4"
      >
        <p className="text-sm text-muted-foreground">
          {closing.initial
            ? `Saldo inicial até ${formatDate(closing.endDate)}, importado do relatório do Secullum.`
            : 'Período fechado. Os valores abaixo são os salvos no fechamento.'}
        </p>
        {closing.id === lastClosing?.id &&
          (closing.initial ? (
            <ClosingDialog
              trigger="Descartar saldo inicial"
              title="Descartar saldo inicial?"
              description="Os saldos importados do Secullum serão descartados e o saldo inicial poderá ser importado de novo."
              confirmLabel="Descartar"
              successMessage="Saldo inicial descartado com sucesso!"
              fields={{ id: closing.id }}
              action={reopenPeriod}
            />
          ) : (
            <ClosingDialog
              trigger="Reabrir período"
              title="Reabrir período?"
              description={`Os saldos salvos de ${formatPeriod(period)} serão descartados e o período volta a ser calculado pelas batidas.`}
              confirmLabel="Reabrir"
              successMessage="Período reaberto com sucesso!"
              fields={{ id: closing.id }}
              action={reopenPeriod}
            />
          ))}
      </section>
    )
  }

  return (
    <section
      aria-label="Fechamento"
      className="flex flex-wrap items-center gap-4"
    >
      <ClosingDialog
        trigger="Fechar período"
        title="Fechar período?"
        description={`Os saldos de ${formatPeriod(period)} serão salvos e passam a ser o saldo anterior do próximo período.`}
        confirmLabel="Fechar"
        successMessage="Período fechado com sucesso!"
        fields={period}
        action={closePeriod}
        onSuccess={() =>
          router.replace(getHoursReportHref({ ...period, order }))
        }
        disabled={closeIssue !== null}
        describedBy={closeIssue ? issueId : undefined}
      />
      {!lastClosing && <ImportInitialBalanceButton order={order} />}
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        {closeIssue && <p id={issueId}>{closeIssue}</p>}
        {lastClosing && (
          <p>
            {lastClosing.initial
              ? `Saldo inicial importado até ${formatDate(lastClosing.endDate)}.`
              : `Último período fechado: ${formatPeriod({ initialDate: lastClosing.startDate, finalDate: lastClosing.endDate })}.`}
          </p>
        )}
      </div>
    </section>
  )
}
