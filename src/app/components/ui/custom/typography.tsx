import { cva, type VariantProps } from 'class-variance-authority'
import { createElement } from 'react'

import { cn } from '@/lib'

/* Adapted from:
 * https://ui.shadcn.com/docs/components/typography
 * https://tailwindcss.com/docs/font-size
 */

const typographyVariants = cva('text-primary', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-center text-5xl font-extrabold tracking-tight text-balance',
      h2: 'scroll-m-20 border-b pb-2 text-4xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-3xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h5: 'text-xl font-bold',
      h6: 'text-lg font-bold',
      base: 'text-base leading-5',
      'body-small': 'text-sm leading-none font-medium',
      subtitle: 'text-sm leading-none font-medium',
      caption: 'text-xs leading-none font-medium text-muted-foreground'
    }
  }
})

type TTypographyComponent =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'p'
  | 'strong'
  | 'span'

type TTypographyProps = {
  component?: TTypographyComponent
  variant?: VariantProps<typeof typographyVariants>['variant']
  muted?: boolean
} & React.ComponentProps<TTypographyComponent>

export const Typography = (props: TTypographyProps) => {
  const {
    component = 'span',
    variant = 'base',
    muted = false,
    className,
    children,
    ...rest
  } = props

  return createElement(
    component,
    {
      className: cn(
        className,
        typographyVariants({ variant }),
        muted && 'text-muted-foreground'
      ),
      ...rest
    },
    children
  )
}
