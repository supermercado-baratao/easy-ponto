'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'

import { JustificationTypeForm } from '@/app/components/blocks/justification-type-form/justification-type-form'
import type { TJustificationTypeFormValues } from '@/app/components/blocks/justification-type-form/types'
import { Button } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'
import type { JustificationType } from '@/infra/database/types'

import { CREATE_TYPE_BUTTON_ID } from '../utils'

export const JustificationTypeSheet = ({
  type,
  defaultValues
}: {
  type?: JustificationType
  defaultValues: TJustificationTypeFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = type ? 'Editar tipo' : 'Cadastrar tipo'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {type ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${type.name}`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger
          id={CREATE_TYPE_BUTTON_ID}
          render={<Button variant="outline" />}
        >
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {type
              ? type.name
              : 'O efeito diz se a ausência desconta do banco de horas ou é abonada.'}
          </SheetDescription>
        </SheetHeader>
        <JustificationTypeForm
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
          className="px-4"
          renderFooter={(submitButton) => (
            <SheetFooter className="flex-row justify-end">
              <SheetClose render={<Button variant="outline" />}>
                Cancelar
              </SheetClose>
              {submitButton}
            </SheetFooter>
          )}
        />
      </SheetContent>
    </Sheet>
  )
}
