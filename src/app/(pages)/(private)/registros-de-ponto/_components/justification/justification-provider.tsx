'use client'

import Link from 'next/link'
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
import type {
  JustificationType,
  TJustificationWithType,
  User
} from '@/infra/database/types'

import { removeJustification } from './actions'
import { JustificationForm } from './justification-form'
import type { TRemoveJustificationState } from './types'
import {
  getDayActionsId,
  getJustificationFormValues,
  getJustificationLabel
} from './utils'

type TTarget = { date: string; justification?: TJustificationWithType }

type TJustificationActions = {
  openForm: (target: TTarget) => void
  openRemoval: (target: Required<TTarget>) => void
}

const JustificationActionsContext = createContext<TJustificationActions | null>(
  null
)

export const useJustificationActions = (): TJustificationActions => {
  const actions = useContext(JustificationActionsContext)
  if (!actions) {
    throw new Error(
      'useJustificationActions must be used inside JustificationProvider'
    )
  }
  return actions
}

const getDayActionsTrigger = (target: TTarget | null): HTMLElement | null =>
  target &&
  document.querySelector<HTMLElement>(`#${getDayActionsId(target.date)}`)

const RemoveJustificationDialog = ({
  open,
  target,
  onClose
}: {
  open: boolean
  target: Required<TTarget> | null
  onClose: () => void
}) => {
  const initialState: TRemoveJustificationState = {}
  const [, formAction, pending] = useActionState(
    async (
      previousState: TRemoveJustificationState,
      formData: FormData
    ): Promise<TRemoveJustificationState> => {
      const result = await removeJustification(previousState, formData)
      if (result.success) {
        toast.success('Justificativa removida com sucesso!')
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
      <AlertDialogContent finalFocus={() => getDayActionsTrigger(target)}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover justificativa?</AlertDialogTitle>
          <AlertDialogDescription>
            {target &&
              `${getJustificationLabel(target.justification)}. O período volta a ser calculado pelas batidas.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input
              type="hidden"
              name="id"
              value={target?.justification.id ?? ''}
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

export const JustificationProvider = ({
  user,
  types,
  children
}: {
  user: Pick<User, 'id' | 'name'>
  types: JustificationType[]
  children: ReactNode
}) => {
  const [formTarget, setFormTarget] = useState<TTarget | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [removalTarget, setRemovalTarget] = useState<Required<TTarget> | null>(
    null
  )
  const [removalOpen, setRemovalOpen] = useState(false)
  const closeForm = useCallback(() => setFormOpen(false), [])
  const actions = useMemo<TJustificationActions>(
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
  const title = formTarget?.justification
    ? 'Editar justificativa'
    : 'Justificar ausência'

  return (
    <JustificationActionsContext value={actions}>
      {children}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          finalFocus={() => getDayActionsTrigger(formTarget)}
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{user.name}</SheetDescription>
          </SheetHeader>
          {types.length > 0 ? (
            formTarget && (
              <JustificationForm
                key={`${formTarget.date}-${formTarget.justification?.id}`}
                userId={user.id}
                types={types}
                defaultValues={
                  formTarget.justification
                    ? getJustificationFormValues(formTarget.justification)
                    : { startDate: formTarget.date, endDate: formTarget.date }
                }
                onSaved={closeForm}
              />
            )
          ) : (
            <p className="px-4 text-sm text-muted-foreground">
              Nenhum tipo de justificativa cadastrado. Cadastre os tipos em{' '}
              <Link
                href="/tipos-de-justificativa"
                className="text-foreground underline underline-offset-4"
              >
                Tipos de Justificativa
              </Link>
              .
            </p>
          )}
        </SheetContent>
      </Sheet>
      <RemoveJustificationDialog
        open={removalOpen}
        target={removalTarget}
        onClose={() => setRemovalOpen(false)}
      />
    </JustificationActionsContext>
  )
}
