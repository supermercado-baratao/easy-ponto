'use client'

import {
  createContext,
  type ReactNode,
  useActionState,
  useContext,
  useMemo,
  useState,
  useTransition
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
import { showActionError } from '@/app/utils/action-error'
import type { TMember } from '@/models/member/types'

import { ADD_MEMBER_BUTTON_ID, getRowActionsId } from '../utils'
import { changeMemberRole, removeMember, transferOwnership } from './actions'
import type { TMemberActionState } from './types'

type TMemberActions = {
  pendingMemberId: string | null
  changeRole: (member: TMember, role: string) => void
  openTransfer: (member: TMember) => void
  openRemoval: (member: TMember) => void
}

const MemberActionsContext = createContext<TMemberActions | null>(null)

export const useMemberActions = (): TMemberActions => {
  const actions = useContext(MemberActionsContext)
  if (!actions) {
    throw new Error(
      'useMemberActions must be used inside MemberActionsProvider'
    )
  }
  return actions
}

const ConfirmMemberDialog = ({
  open,
  member,
  title,
  description,
  submitLabel,
  destructive,
  successMessage,
  action,
  finalFocus,
  onClose
}: {
  open: boolean
  member: TMember | null
  title: string
  description: string
  submitLabel: string
  destructive?: boolean
  successMessage: string
  action: (
    state: TMemberActionState,
    formData: FormData
  ) => Promise<TMemberActionState>
  finalFocus: () => HTMLElement | null
  onClose: () => void
}) => {
  const initialState: TMemberActionState = {}
  // The row may unmount with the refresh that comes with the result, so the toast can't wait for an
  // effect
  const [, formAction, pending] = useActionState(
    async (
      previousState: TMemberActionState,
      formData: FormData
    ): Promise<TMemberActionState> => {
      const result = await action(previousState, formData)
      if (result.success) {
        toast.success(successMessage)
        onClose()
      } else {
        showActionError(result)
        if (result.message) onClose()
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
      <AlertDialogContent finalFocus={finalFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={member?.id ?? ''} />
            <Button
              type="submit"
              variant={destructive ? 'destructive' : 'default'}
              disabled={pending}
              focusableWhenDisabled
              className="w-full"
            >
              {pending ? (
                <Loader mode="inline" label={submitLabel} />
              ) : (
                submitLabel
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const getElement = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`#${id}`)

// The row and its trigger are gone after a removal, and so is the menu of the new owner after a
// transfer
const getFinalFocus = (member: TMember | null): HTMLElement | null =>
  (member && getElement(getRowActionsId(member.id))) ??
  getElement(ADD_MEMBER_BUTTON_ID)

export const MemberActionsProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [transferTarget, setTransferTarget] = useState<TMember | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [removalTarget, setRemovalTarget] = useState<TMember | null>(null)
  const [removalOpen, setRemovalOpen] = useState(false)
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const actions = useMemo<TMemberActions>(
    () => ({
      pendingMemberId,
      changeRole: (member, role) => {
        setPendingMemberId(member.id)
        startTransition(async () => {
          const result = await changeMemberRole({ id: member.id, role })
          if (result.success) {
            toast.success('Papel alterado com sucesso!')
          } else {
            showActionError(result)
          }
          setPendingMemberId(null)
        })
      },
      openTransfer: (member) => {
        setTransferTarget(member)
        setTransferOpen(true)
      },
      openRemoval: (member) => {
        setRemovalTarget(member)
        setRemovalOpen(true)
      }
    }),
    [pendingMemberId]
  )

  return (
    <MemberActionsContext value={actions}>
      {children}
      <ConfirmMemberDialog
        open={transferOpen}
        member={transferTarget}
        title="Transferir a propriedade?"
        description={
          transferTarget
            ? `${transferTarget.name} passa a ser proprietário da empresa, e você passa a ser admin. Só o novo proprietário pode desfazer a transferência.`
            : ''
        }
        submitLabel="Transferir"
        successMessage="Propriedade transferida com sucesso!"
        action={transferOwnership}
        finalFocus={() => getFinalFocus(transferTarget)}
        onClose={() => setTransferOpen(false)}
      />
      <ConfirmMemberDialog
        open={removalOpen}
        member={removalTarget}
        title="Remover da empresa?"
        description={
          removalTarget
            ? `${removalTarget.name} perde o acesso aos dados desta empresa. A conta continua valendo nas outras empresas de que participa.`
            : ''
        }
        submitLabel="Remover"
        destructive
        successMessage="Membro removido com sucesso!"
        action={removeMember}
        finalFocus={() => getFinalFocus(removalTarget)}
        onClose={() => setRemovalOpen(false)}
      />
    </MemberActionsContext>
  )
}
