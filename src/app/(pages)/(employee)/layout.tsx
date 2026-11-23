import { Clock } from 'lucide-react'

import { SignOutButton } from '@/app/components/blocks/sign-out/sign-out-button'
import { ToggleTheme } from '@/app/components/blocks/toggle-theme'

const Layout = ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <span className="flex items-center gap-2 font-semibold tracking-tight">
          <Clock aria-hidden className="size-5" />
          Easy Ponto
        </span>
        <div className="flex items-center gap-2">
          <ToggleTheme />
          <SignOutButton />
        </div>
      </div>
    </header>
    {children}
  </div>
)

export default Layout
