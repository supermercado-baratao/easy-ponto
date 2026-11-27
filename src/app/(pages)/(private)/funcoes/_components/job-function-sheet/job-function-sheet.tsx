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
import type { JobFunction } from '@/infra/database/types'

import { CREATE_FUNCTION_BUTTON_ID } from '../utils'
import { JobFunctionForm } from './job-function-form'
import type { TJobFunctionFormValues } from './types'

export const JobFunctionSheet = ({
  jobFunction,
  defaultValues
}: {
  jobFunction?: JobFunction
  defaultValues: TJobFunctionFormValues
}) => {
  const [open, setOpen] = useState(false)
  const title = jobFunction ? 'Editar função' : 'Cadastrar função'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {jobFunction ? (
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${jobFunction.name}`}
            />
          }
        >
          <Pencil aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger
          id={CREATE_FUNCTION_BUTTON_ID}
          render={<Button variant="outline" />}
        >
          {title}
        </SheetTrigger>
      )}
      <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {jobFunction
              ? jobFunction.name
              : 'Uma função que os funcionários exercem na loja, com o nível dela na hierarquia.'}
          </SheetDescription>
        </SheetHeader>
        <JobFunctionForm
          defaultValues={defaultValues}
          onSaved={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
