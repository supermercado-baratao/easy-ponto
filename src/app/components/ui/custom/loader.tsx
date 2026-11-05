import { cn } from 'cn'
import { type LucideProps } from 'lucide-react'

import { Spinner } from '../shadcn-io/spinner'

type TLoaderProps = {
  mode?: 'absolute' | 'inline'
  variant?: 'ellipsis' | 'circle'
  open?: boolean
} & LucideProps

export const Loader = (props: TLoaderProps) => {
  const {
    mode = 'absolute',
    variant = 'circle',
    className,
    open = true,
    ...rest
  } = props

  if (!open) return null

  if (mode === 'inline') {
    return <Spinner className={className} variant={variant} {...rest} />
  }

  return (
    <div className="absolute inset-0 flex h-svh w-full items-center justify-center">
      <Spinner
        className={cn('size-8', className)}
        variant={variant}
        {...rest}
      />
    </div>
  )
}
