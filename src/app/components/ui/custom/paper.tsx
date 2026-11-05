import { cn } from 'cn'
import { createElement } from 'react'

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
        'flex flex-col gap-6 rounded-xl border bg-card p-4 text-card-foreground shadow-sm',
        className
      ),
      ...rest
    },
    children
  )
}
