'use client'

import { CalendarRange } from 'lucide-react'
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

import { PlanForm } from './plan-form'
import type { TPlanFormValues } from './types'

export const PlanSheet = ({
  triggerId,
  userName,
  year,
  registered,
  defaultValues
}: {
  triggerId: string
  userName: string
  year: number
  registered: boolean
  defaultValues: TPlanFormValues
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            id={triggerId}
            variant="ghost"
            size="icon"
            aria-label={`Planejar as férias de ${userName}`}
          />
        }
      >
        <CalendarRange aria-hidden="true" />
      </SheetTrigger>
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Planejar férias</SheetTitle>
          <SheetDescription>
            {userName}, {year}
            {registered &&
              '. As férias desse ano já foram registradas. Remova a justificativa nos registros de ponto para mudar o mês.'}
          </SheetDescription>
        </SheetHeader>
        <PlanForm
          registered={registered}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
