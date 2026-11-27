'use client'

import { type ReactNode, useState } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'
import { dayjs } from '@/infra/dayjs'
import type { TCalendarDay } from '@/models/workload-calendar/types'

import type { TCalendarAssignmentOption } from '../types'
import { DayForm } from './day-form'
import { getDayFormValues } from './utils'

export const DaySheet = ({
  userId,
  name,
  day,
  assignments,
  label,
  children
}: {
  userId: string
  name: string
  day: TCalendarDay
  assignments: TCalendarAssignmentOption[]
  label: string
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const title = dayjs(day.date).format('dddd, D [de] MMMM [de] YYYY')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={`Ajustar o dia ${label}`}
        className="flex size-full flex-col gap-1 rounded-md p-1 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {title.charAt(0).toLocaleUpperCase('pt-BR') + title.slice(1)}
          </SheetTitle>
          <SheetDescription>{name}</SheetDescription>
        </SheetHeader>
        <DayForm
          assignments={assignments}
          defaultValues={getDayFormValues(userId, day)}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
