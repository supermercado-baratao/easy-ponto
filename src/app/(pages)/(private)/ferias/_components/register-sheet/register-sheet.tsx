'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { Button, buttonVariants } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'
import type { JustificationType } from '@/infra/database/types'

import { RegisterForm } from './register-form'
import type { TRegisterFormValues } from './types'

export const RegisterSheet = ({
  focusAfterRegisterId,
  registered,
  userName,
  types,
  defaultValues
}: {
  focusAfterRegisterId: string
  registered: boolean
  userName: string
  types: JustificationType[]
  defaultValues: TRegisterFormValues
}) => {
  const [open, setOpen] = useState(false)
  const hasRegistered = useRef(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!registered && (
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              aria-label={`Registrar as férias de ${userName}`}
            />
          }
        >
          Registrar
        </SheetTrigger>
      )}
      <SheetContent
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        // The trigger is gone once the vacation is registered, so the focus would fall back to the body
        finalFocus={() =>
          hasRegistered.current
            ? document.querySelector<HTMLElement>(`#${focusAfterRegisterId}`)
            : true
        }
      >
        <SheetHeader>
          <SheetTitle>Registrar férias</SheetTitle>
          <SheetDescription>
            {userName}. As férias viram uma justificativa nos registros de
            ponto.
          </SheetDescription>
        </SheetHeader>
        {types.length > 0 ? (
          <RegisterForm
            types={types}
            defaultValues={defaultValues}
            onSaved={() => {
              hasRegistered.current = true
              setOpen(false)
            }}
          />
        ) : (
          <div className="flex flex-col items-start gap-3 px-4 text-sm">
            <p className="text-muted-foreground">
              Nenhum tipo de justificativa cadastrado. Cadastre o tipo das
              férias para registrá-las.
            </p>
            <Link
              href="/tipos-de-justificativa"
              className={buttonVariants({ variant: 'outline' })}
            >
              Ir para Tipos de Justificativa
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
