'use client'

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

import { ADD_MEMBER_BUTTON_ID } from '../utils'
import { AddMemberForm } from './add-member-form'

export const AddMemberSheet = ({ actorRole }: { actorRole: string }) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        id={ADD_MEMBER_BUTTON_ID}
        render={<Button variant="outline" />}
      >
        Adicionar membro
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Adicionar membro</SheetTitle>
          <SheetDescription>
            O membro entra com o e-mail e acessa os dados da empresa conforme o
            papel.
          </SheetDescription>
        </SheetHeader>
        <AddMemberForm actorRole={actorRole} onSaved={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
