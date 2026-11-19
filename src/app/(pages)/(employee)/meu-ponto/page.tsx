import { Clock } from 'lucide-react'
import Link from 'next/link'

import { SignOutButton } from '@/app/components/blocks/sign-out/sign-out-button'
import { ToggleTheme } from '@/app/components/blocks/toggle-theme'
import { Typography } from '@/app/components/ui/custom/typography'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { CHANGE_PASSWORD_PATH } from '@/entry/session'

import { getEmployeeHomePageData } from './data'

const EmployeeHome = async () => {
  const { name, companyName } = await getEmployeeHomePageData()

  return (
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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
        <Typography component="h1" variant="h4">
          Olá, {name}
        </Typography>
        <Typography component="p" variant="base">
          Em breve, você vai consultar aqui os seus registros de ponto em{' '}
          {companyName}.
        </Typography>
        <div>
          <Link
            href={CHANGE_PASSWORD_PATH}
            className={buttonVariants({ variant: 'outline' })}
          >
            Trocar senha
          </Link>
        </div>
      </main>
    </div>
  )
}

export default EmployeeHome
