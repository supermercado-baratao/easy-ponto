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
import type { UserGroup } from '@/infra/database/types'

import { CREATE_GROUP_BUTTON_ID } from '../utils'
import type { TUserGroupFormValues } from './types'
import { UserGroupForm } from './user-group-form'

export const UserGroupSheet = ({
  group,
  groups,
  defaultValues
}: {
  group?: UserGroup
  groups: UserGroup[]
  defaultValues: TUserGroupFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = group ? 'Editar grupo' : 'Cadastrar grupo'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {group ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${group.name}`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger
          id={CREATE_GROUP_BUTTON_ID}
          render={<Button variant="outline" />}
        >
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {group
              ? group.name
              : 'Um setor, uma seção dentro dele ou qualquer outro grupo de funcionários.'}
          </SheetDescription>
        </SheetHeader>
        <UserGroupForm
          groups={groups}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
