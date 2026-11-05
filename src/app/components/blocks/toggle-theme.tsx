'use client'

import { cn } from 'cn'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/app/components/ui/shadcn/button'
import { SidebarMenuButton } from '@/app/components/ui/shadcn/sidebar'

const Icon = () => {
  return (
    <>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </>
  )
}

type TToggleThemeProps = {
  variant?: 'default' | 'sidebar'
} & React.ComponentProps<'button'>

export const ToggleTheme = ({
  variant = 'default',
  ...props
}: TToggleThemeProps) => {
  const { setTheme } = useTheme()

  const handleThemeChange = () => {
    setTheme((theme) => (theme === 'dark' ? 'light' : 'dark'))
  }

  if (variant === 'sidebar') {
    return (
      <SidebarMenuButton {...props} onClick={handleThemeChange}>
        <Icon />
        <span>Mudar Tema</span>
      </SidebarMenuButton>
    )
  }

  return (
    <Button
      {...props}
      className={cn('cursor-pointer', props.className)}
      variant="outline"
      size="icon"
      onClick={handleThemeChange}
    >
      <Icon />
      <span className="sr-only">Mudar Tema</span>
    </Button>
  )
}
