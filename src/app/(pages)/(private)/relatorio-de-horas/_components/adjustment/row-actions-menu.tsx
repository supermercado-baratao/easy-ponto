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
import type { HoursBankAdjustment, User } from '@/infra/database/types'

import { getRowActionsId } from '../utils'
import { useAdjustmentActions } from './adjustment-provider'
import { getAdjustmentLabel, getAdjustmentShortLabel } from './utils'

export const RowActionsMenu = ({
  user,
  adjustments
}: {
  user: Pick<User, 'id' | 'name'>
  adjustments: HoursBankAdjustment[]
}) => {
  const { openForm, openRemoval } = useAdjustmentActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={getRowActionsId(user.id)}
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações de ${user.name}`}
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <DropdownMenuItem onClick={() => openForm({ user })}>
          Adicionar ajuste
        </DropdownMenuItem>
        {adjustments.map((adjustment) => {
          const label = getAdjustmentShortLabel(adjustment)
          return (
            <Fragment key={adjustment.id}>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="sr-only">
                  {getAdjustmentLabel(adjustment)}
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => openForm({ user, adjustment })}
                >
                  Editar ajuste de {label}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => openRemoval({ user, adjustment })}
                >
                  Remover ajuste de {label}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
