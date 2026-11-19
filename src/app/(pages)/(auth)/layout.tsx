import { Clock } from 'lucide-react'
import Link from 'next/link'

import { ToggleTheme } from '@/app/components/blocks/toggle-theme'

const Layout = ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold tracking-tight"
      >
        <Clock aria-hidden className="size-5" />
        Easy Ponto
      </Link>
      <ToggleTheme />
    </header>
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      {children}
    </main>
  </div>
)

export default Layout
