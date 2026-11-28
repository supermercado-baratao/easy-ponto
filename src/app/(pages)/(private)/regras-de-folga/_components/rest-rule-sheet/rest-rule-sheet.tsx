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
import type { TRestRuleWithRelations } from '@/infra/database/types'

import type { TShiftPatternOption } from '../types'
import { CREATE_RULE_BUTTON_ID } from '../utils'
import { RestRuleForm } from './rest-rule-form'
import type { TRestRuleFormValues } from './types'

export const RestRuleSheet = ({
  rule,
  rules,
  shiftPatterns,
  defaultValues
}: {
  rule?: TRestRuleWithRelations
  rules: TRestRuleWithRelations[]
  shiftPatterns: TShiftPatternOption[]
  defaultValues: TRestRuleFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = rule ? 'Editar regra de folga' : 'Cadastrar regra de folga'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {rule ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${rule.name}`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger
          id={CREATE_RULE_BUTTON_ID}
          render={<Button variant="outline" />}
        >
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {rule
              ? rule.name
              : 'Onde a folga da escala pode cair no mês e para onde ela vai quando cai fora disso.'}
          </SheetDescription>
        </SheetHeader>
        <RestRuleForm
          rule={rule}
          rules={rules}
          shiftPatterns={shiftPatterns}
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
