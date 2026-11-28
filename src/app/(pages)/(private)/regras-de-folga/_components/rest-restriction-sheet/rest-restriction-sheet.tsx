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

import type { TGroupOption, TUserOption } from '../types'
import { CREATE_RESTRICTION_BUTTON_ID } from '../utils'
import { RestRestrictionForm } from './rest-restriction-form'
import type { TRestRestrictionFormValues } from './types'

export const RestRestrictionSheet = ({
  label,
  users,
  groups,
  defaultValues
}: {
  label?: string
  users: TUserOption[]
  groups: TGroupOption[]
  defaultValues: TRestRestrictionFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = label
    ? 'Editar restrição de folga'
    : 'Cadastrar restrição de folga'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {label ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar a restrição “${label}”`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger
          id={CREATE_RESTRICTION_BUTTON_ID}
          render={<Button variant="outline" className="self-start" />}
        >
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {label ??
              'Quem não pode folgar junto e em que dias, para a folga da escala e a folga movida.'}
          </SheetDescription>
        </SheetHeader>
        <RestRestrictionForm
          users={users}
          groups={groups}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
