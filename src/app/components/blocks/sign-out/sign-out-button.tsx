'use client'

import { LogOut } from 'lucide-react'
import { useFormStatus } from 'react-dom'

import { Loader } from '@/app/components/ui/custom/loader'
import { Button } from '@/app/components/ui/shadcn/button'
import { SidebarMenuButton } from '@/app/components/ui/shadcn/sidebar'

import { signOut } from './actions'

const SubmitButton = ({ variant }: { variant: 'button' | 'sidebar' }) => {
  const { pending } = useFormStatus()

  if (variant === 'sidebar') {
    return (
      <SidebarMenuButton type="submit" aria-busy={pending}>
        {pending ? <Loader mode="inline" /> : <LogOut />}
        <span>Sair</span>
      </SidebarMenuButton>
    )
  }

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      focusableWhenDisabled
    >
      {pending ? <Loader mode="inline" label="Sair" /> : 'Sair'}
    </Button>
  )
}

export const SignOutButton = ({
  variant = 'button'
}: {
  variant?: 'button' | 'sidebar'
}) => (
  <form action={signOut}>
    <SubmitButton variant={variant} />
  </form>
)
