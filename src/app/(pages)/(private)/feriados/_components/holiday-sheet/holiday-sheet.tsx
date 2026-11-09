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
import type { THolidayInYear } from '@/models/holiday/types'

import { getHolidayLabel } from '../utils'
import { HolidayForm } from './holiday-form'
import type { THolidayFormValues } from './types'

export const HolidaySheet = ({
  holiday,
  defaultValues
}: {
  holiday?: THolidayInYear
  defaultValues: THolidayFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = holiday ? 'Editar feriado' : 'Cadastrar feriado'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {holiday ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${getHolidayLabel(holiday)}`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger render={<Button variant="outline" />}>
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {holiday
              ? getHolidayLabel(holiday)
              : 'Um feriado muda a jornada esperada do dia.'}
          </SheetDescription>
        </SheetHeader>
        <HolidayForm
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
