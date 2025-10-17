import { AlertCircle, X } from 'lucide-react'

import { cn } from '@/app/lib/utils'

import {
  Alert as AlertWrapper,
  AlertDescription,
  AlertTitle
} from '../shadcn-ui/alert'
import { Button } from '../shadcn-ui/button'

export type TAlertAttributes = {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

type TAlertProps = {
  open: boolean
  handleClose(): void
} & TAlertAttributes

export const Alert = ({
  title,
  description,
  variant,
  open,
  handleClose
}: TAlertProps) => {
  return (
    <AlertWrapper
      variant={variant}
      className={cn('fixed top-0 right-0 max-w-xs', { hidden: !open })}
    >
      <AlertCircle />
      <div className="flex justify-between gap-2 w-full">
        <AlertTitle>{title}</AlertTitle>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            'border border-accent-foreground h-fit w-fit p-0.5 cursor-pointer hover:border-accent-foreground/60 hover:[&>svg]:text-accent-foreground/60',
            {
              'border-destructive hover:border-red-500 [&>svg]:text-destructive hover:[&>svg]:text-red-500':
                variant === 'destructive'
            }
          )}
          onClick={handleClose}
        >
          <X className="size-3" />
        </Button>
      </div>
      <AlertDescription>{description}</AlertDescription>
    </AlertWrapper>
  )
}
