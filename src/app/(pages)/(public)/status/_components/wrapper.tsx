import { cn } from 'cn'

export const Wrapper = ({
  children,
  className,
  ...rest
}: { children: React.ReactNode } & React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('p-4 flex flex-col items-center h-svh w-full', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
