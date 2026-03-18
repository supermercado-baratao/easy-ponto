import { cn } from '@/lib'

export const MainContent = (props: React.ComponentProps<'div'>) => {
  const { className, children, ...rest } = props
  return (
    <div className={cn('p-4', className)} {...rest}>
      {children}
    </div>
  )
}
