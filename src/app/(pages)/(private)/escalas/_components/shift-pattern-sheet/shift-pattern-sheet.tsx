'use client'

import { CalendarPlus, Pencil } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import { Button } from '@/app/components/ui/shadcn/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/app/components/ui/shadcn/sheet'

import { CREATE_SHIFT_PATTERN_BUTTON_ID } from '../utils'
import { ShiftPatternForm } from './shift-pattern-form'
import type { TShiftPatternFormValues, TShiftPatternSheetMode } from './types'

const TITLES: Record<TShiftPatternSheetMode, string> = {
  create: 'Cadastrar escala',
  'new-version': 'Nova versão',
  'edit-version': 'Editar versão'
}

const Trigger = ({
  mode,
  label,
  id
}: {
  mode: TShiftPatternSheetMode
  label?: string
  id?: string
}): ReactElement => {
  if (mode === 'create') {
    return (
      <SheetTrigger
        id={CREATE_SHIFT_PATTERN_BUTTON_ID}
        render={<Button variant="outline" />}
      >
        {TITLES.create}
      </SheetTrigger>
    )
  }
  if (mode === 'new-version') {
    return (
      <SheetTrigger
        id={id}
        render={<Button variant="outline" size="sm" aria-label={label} />}
      >
        <CalendarPlus aria-hidden="true" />
        {TITLES['new-version']}
      </SheetTrigger>
    )
  }
  return (
    <SheetTrigger
      render={<Button variant="ghost" size="icon" aria-label={label} />}
    >
      <Pencil aria-hidden="true" />
    </SheetTrigger>
  )
}

export const ShiftPatternSheet = ({
  mode,
  label,
  triggerId,
  description,
  defaultValues
}: {
  mode: TShiftPatternSheetMode
  label?: string
  triggerId?: string
  description: string
  defaultValues: TShiftPatternFormValues
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Trigger mode={mode} label={label} id={triggerId} />
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>{TITLES[mode]}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <ShiftPatternForm
          mode={mode}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
