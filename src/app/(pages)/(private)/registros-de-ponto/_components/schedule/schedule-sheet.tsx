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

import { ScheduleForm } from './schedule-form'
import type { TScheduleFormValues } from './types'

export const ScheduleSheet = ({
  userId,
  userName,
  hasSchedule,
  defaultValues
}: {
  userId: string
  userName: string
  hasSchedule: boolean
  defaultValues: TScheduleFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = hasSchedule ? 'Editar escala' : 'Cadastrar escala'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" />}>{title}</SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{userName}</SheetDescription>
        </SheetHeader>
        <ScheduleForm
          userId={userId}
          hasSchedule={hasSchedule}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
