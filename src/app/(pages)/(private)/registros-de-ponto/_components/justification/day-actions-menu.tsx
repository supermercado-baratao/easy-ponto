'use client'

import { Ellipsis } from 'lucide-react'
import { Fragment } from 'react'

import { Button } from '@/app/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/app/components/ui/shadcn/dropdown-menu'
import type { TJustificationWithType } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

import { useJustificationActions } from './justification-provider'
import {
  getDayActionsId,
  getJustificationLabel,
  getJustificationShortLabel
} from './utils'

export const DayActionsMenu = ({
  date,
  justifications
}: {
  date: string
  justifications: TJustificationWithType[]
}) => {
  const { openForm, openRemoval } = useJustificationActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={getDayActionsId(date)}
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações de ${dayjs(date).format('DD/MM/YYYY')}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuItem onClick={() => openForm({ date })}>
          Justificar
        </DropdownMenuItem>
        {justifications.map((justification) => {
          const label = getJustificationShortLabel(justification)
          return (
            <Fragment key={justification.id}>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="sr-only">
                  {getJustificationLabel(justification)}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => openForm({ date, justification })}
                >
                  Editar {label}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openRemoval({ date, justification })}
                >
                  Remover {label}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
