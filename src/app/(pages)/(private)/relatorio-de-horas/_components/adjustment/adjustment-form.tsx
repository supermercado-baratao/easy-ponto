'use client'

import { useActionState, useEffect, useId, useRef } from 'react'
import { toast } from 'sonner'

import { FormField } from '@/app/components/ui/custom/form'
import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SheetClose, SheetFooter } from '@/app/components/ui/shadcn/sheet'

import { save } from './actions'
import type { TAdjustmentFormState, TAdjustmentFormValues } from './types'

export const AdjustmentForm = ({
  userId,
  defaultValues,
  onSaved
}: {
  userId: string
  defaultValues: TAdjustmentFormValues
  onSaved: () => void
}) => {
  const initialState: TAdjustmentFormState = {}
  const [state, formAction, pending] = useActionState(save, initialState)
  const values = state.values ?? defaultValues
  const id = useId()
  const formId = `${id}-form`
  const formReference = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (pending) return

    if (state.success) {
      toast.success('Ajuste salvo com sucesso!')
      onSaved()
      return
    }

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state, onSaved])

  const getFieldProps = (
    name: keyof TAdjustmentFormValues
  ): {
    id: string
    name: string
    defaultValue?: string
    error?: string
    'aria-invalid'?: true
  } => {
    const error = state.errors?.[name as keyof typeof state.errors]
    return {
      id: `${id}-${name}`,
      name,
      defaultValue: values[name],
      error,
      'aria-invalid': error ? true : undefined
    }
  }

  return (
    <>
      <form
        ref={formReference}
        id={formId}
        action={formAction}
        noValidate
        className="flex flex-col gap-4 overflow-y-auto px-4"
      >
        <input type="hidden" name="userId" value={userId} />
        {values.id && <input type="hidden" name="id" value={values.id} />}
        <FormField {...getFieldProps('date')} type="date" label="Data" />
        <FormField
          {...getFieldProps('minutes')}
          label="Horas"
          description="Use hh:mm para somar ao saldo e -hh:mm para descontar."
          placeholder="01:30"
        />
        <FormField {...getFieldProps('reason')} label="Motivo" />
      </form>
      <SheetFooter className="flex-row justify-end">
        <SheetClose render={<Button variant="outline" />}>Cancelar</SheetClose>
        <Button type="submit" form={formId} disabled={pending}>
          {pending ? <Loader mode="inline" /> : 'Salvar'}
        </Button>
      </SheetFooter>
    </>
  )
}
