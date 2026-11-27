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
import type { JobFunction, UserGroup } from '@/infra/database/types'

import type { TUserFormValues } from './types'
import { UserForm } from './user-form'

export const UserSheet = ({
  name,
  groups,
  jobFunctions,
  defaultValues
}: {
  name: string
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  defaultValues: TUserFormValues
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Editar ${name}`} />
        }
      >
        <Pencil aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar funcionário</SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>
        <UserForm
          groups={groups}
          jobFunctions={jobFunctions}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
