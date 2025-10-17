import '@/app/styles/globals.css'

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { UIProvider } from '../contexts/ui-context'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'Easy Ponto',
  description:
    'Aplicação completa para controle de ponto e organização de jornadas de trabalho'
}

const RootLayout = ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  )
}

export default RootLayout
