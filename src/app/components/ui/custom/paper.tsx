import { createElement } from 'react'

import { cn } from '@/lib'

type TPaperComponent = 'div' | 'main' | 'section' | 'article'

type TPaperProps = {
  component?: TPaperComponent
  children: React.ReactNode
} & React.ComponentProps<TPaperComponent>

/* Adapted from:
 * https://ui.shadcn.com/docs/components/card
 */

export const Paper = (props: TPaperProps) => {
  const { component = 'div', className, children, ...rest } = props

  return createElement(
    component,
    {
      className: cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-4 shadow-sm',
        className
      ),
      ...rest
    },
    children
  )
}
