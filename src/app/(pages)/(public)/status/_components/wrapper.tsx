import { cn } from 'cn'

export const Wrapper = ({
  children,
  className,
  ...rest
}: { children: React.ReactNode } & React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('flex h-svh w-full flex-col items-center p-4', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
