'use client'

import { KeyRound } from 'lucide-react'
import { useActionState, useState } from 'react'
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

import { resetPassword } from './actions'
import type { TResetPasswordState } from './types'

export const ResetPasswordButton = ({
  id,
  name
}: {
  id: string
  name: string
}) => {
  const initialState: TResetPasswordState = {}
  const [open, setOpen] = useState(false)
  const [, formAction, pending] = useActionState(
    async (
      previousState: TResetPasswordState,
      formData: FormData
    ): Promise<TResetPasswordState> => {
      const result = await resetPassword(previousState, formData)
      if (result.success) {
        toast.success('Senha redefinida com sucesso!')
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
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Redefinir a senha de ${name}`}
          />
        }
      >
        <KeyRound aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Redefinir a senha?</AlertDialogTitle>
          <AlertDialogDescription>
            A senha de {name} volta a ser a senha padrão: os cinco primeiros
            dígitos do CPF seguidos do último nome, em minúsculas e sem acentos.
            No próximo acesso, será preciso criar uma nova senha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              disabled={pending}
              focusableWhenDisabled
              className="w-full"
            >
              {pending ? (
                <Loader mode="inline" label="Redefinir" />
              ) : (
                'Redefinir'
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
