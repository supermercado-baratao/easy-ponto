import { type LucideProps } from 'lucide-react'

import { cn } from '@/lib'

import { Spinner } from '../shadcn-io/spinner'

type TLoaderProps = {
  mode?: 'absolute' | 'inline'
  variant?: 'ellipsis' | 'circle'
} & LucideProps

export const Loader = (props: TLoaderProps) => {
  const { mode = 'absolute', variant = 'circle', className, ...rest } = props

  if (mode === 'inline') {
    return <Spinner className={className} variant={variant} {...rest} />
  }

  return (
    <div className="absolute w-full h-svh inset-0 flex items-center justify-center">
      <Spinner
        className={cn('size-8', className)}
        variant={variant}
        {...rest}
      />
    </div>
  )
}
