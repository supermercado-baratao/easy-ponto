'use client'

import {
  createContext,
  type ReactNode,
  useActionState,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'
import { toast } from 'sonner'

import { Loader } from '@/app/components/ui/custom/loader'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/app/components/ui/shadcn/alert-dialog'
import { Button } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/app/components/ui/shadcn/sheet'
import type { HoursBankAdjustment, User } from '@/infra/database/types'

import { getRowActionsId } from '../utils'
import { removeAdjustment } from './actions'
import { AdjustmentForm } from './adjustment-form'
import type { TRemoveAdjustmentState } from './types'
import { getAdjustmentFormValues, getAdjustmentLabel } from './utils'

type TTarget = {
  user: Pick<User, 'id' | 'name'>
  adjustment?: HoursBankAdjustment
}

type TAdjustmentActions = {
  openForm: (target: TTarget) => void
  openRemoval: (target: Required<TTarget>) => void
}

const AdjustmentActionsContext = createContext<TAdjustmentActions | null>(null)

export const useAdjustmentActions = (): TAdjustmentActions => {
  const actions = useContext(AdjustmentActionsContext)
  if (!actions) {
    throw new Error(
      'useAdjustmentActions must be used inside AdjustmentProvider'
    )
  }
  return actions
}

const getRowActionsTrigger = (target: TTarget | null): HTMLElement | null =>
  target &&
  document.querySelector<HTMLElement>(`#${getRowActionsId(target.user.id)}`)

const RemoveAdjustmentDialog = ({
  open,
  target,
  onClose
}: {
  open: boolean
  target: Required<TTarget> | null
  onClose: () => void
}) => {
  const initialState: TRemoveAdjustmentState = {}
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveAdjustmentState,
      formData: FormData
    ): Promise<TRemoveAdjustmentState> => {
      const result = await removeAdjustment(previousState, formData)
      if (result.success) {
        toast.success('Ajuste removido com sucesso!')
        onClose()
      } else if (result.message) {
        toast.error(result.message, { description: result.action })
        onClose()
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
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <AlertDialogContent finalFocus={() => getRowActionsTrigger(target)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover ajuste?</AlertDialogTitle>
          <AlertDialogDescription>
            {target &&
              `${getAdjustmentLabel(target.adjustment)}. O saldo de ${target.user.name} deixa de contar esse ajuste.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input
              type="hidden"
              name="id"
              value={target?.adjustment.id ?? ''}
            />
            <Button
              type="submit"
              variant="destructive"
              disabled={pending}
              className="w-full"
            >
              {pending ? <Loader mode="inline" /> : 'Remover'}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const AdjustmentProvider = ({
  defaultDate,
  children
}: {
  defaultDate: string
  children: ReactNode
}) => {
  const [formTarget, setFormTarget] = useState<TTarget | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [removalTarget, setRemovalTarget] = useState<Required<TTarget> | null>(
    null
  )
  const [removalOpen, setRemovalOpen] = useState(false)
  const closeForm = useCallback(() => setFormOpen(false), [])
  const actions = useMemo<TAdjustmentActions>(
    () => ({
      openForm: (target) => {
        setFormTarget(target)
        setFormOpen(true)
      },
      openRemoval: (target) => {
        setRemovalTarget(target)
        setRemovalOpen(true)
      }
    }),
    []
  )

  return (
    <AdjustmentActionsContext value={actions}>
      {children}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          finalFocus={() => getRowActionsTrigger(formTarget)}
        >
          <SheetHeader>
            <SheetTitle>
              {formTarget?.adjustment ? 'Editar ajuste' : 'Adicionar ajuste'}
            </SheetTitle>
            <SheetDescription>{formTarget?.user.name}</SheetDescription>
          </SheetHeader>
          {formTarget && (
            <AdjustmentForm
              key={`${formTarget.user.id}-${formTarget.adjustment?.id}`}
              userId={formTarget.user.id}
              defaultValues={
                formTarget.adjustment
                  ? getAdjustmentFormValues(formTarget.adjustment)
                  : { date: defaultDate }
              }
              onSaved={closeForm}
            />
          )}
        </SheetContent>
      </Sheet>
      <RemoveAdjustmentDialog
        open={removalOpen}
        target={removalTarget}
        onClose={() => setRemovalOpen(false)}
      />
    </AdjustmentActionsContext>
  )
}
