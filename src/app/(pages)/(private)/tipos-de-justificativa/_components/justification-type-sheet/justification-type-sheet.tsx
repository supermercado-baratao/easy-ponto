'use client'

import { Pencil } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'
import type { JustificationType } from '@/infra/database/types'

import { CREATE_TYPE_BUTTON_ID } from '../utils'
import { JustificationTypeForm } from './justification-type-form'
import type { TJustificationTypeFormValues } from './types'

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
              aria-label={`Editar ${type.code}`}
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
              ? `${type.code} – ${type.description}`
              : 'O efeito diz se a ausência desconta do banco de horas ou é abonada.'}
          </SheetDescription>
        </SheetHeader>
        <JustificationTypeForm
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
