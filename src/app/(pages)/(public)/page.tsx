import { Clock } from 'lucide-react'
import Link from 'next/link'

import { ToggleTheme } from '@/app/components/blocks/toggle-theme'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { SIGN_IN_PATH } from '@/entry/session'

import { Features } from './_components/features'
import { TimeCardPreview } from './_components/time-card-preview'
import { redirectSignedInUser } from './data'

const LandingPage = async () => {
  await redirectSignedInUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <Clock aria-hidden className="size-5" />
            Easy Ponto
          </Link>
          <div className="flex items-center gap-2">
            <ToggleTheme />
            <Link href={SIGN_IN_PATH} className={buttonVariants()}>
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 py-16 sm:px-6 lg:py-24">
        <section className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              O ponto da sua loja, do relógio ao banco de horas
            </h1>
            <p className="max-w-lg text-lg text-pretty text-muted-foreground">
              O Easy Ponto lê as batidas do relógio de ponto, calcula a jornada
              de cada funcionário e fecha o banco de horas do período.
            </p>
            <div>
              <Link
                href={SIGN_IN_PATH}
                className={buttonVariants({ size: 'lg' })}
              >
                Entrar
              </Link>
            </div>
          </div>
          <TimeCardPreview />
        </section>

        <Features />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Easy Ponto</span>
          <Link href="/status" className="py-1 hover:text-foreground">
            Status do sistema
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
