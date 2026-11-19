'use client'

import { Building2, ChevronsUpDown, Clock } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/app/components/ui/shadcn/dropdown-menu'
import {
  SidebarHeader as _SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn/sidebar'

import { switchCompany } from './actions'
import type { TSidebarCompany } from './types'

const CompanySwitcher = ({
  company,
  companies
}: {
  company: TSidebarCompany
  companies: TSidebarCompany[]
}) => {
  const [pending, startTransition] = useTransition()

  const handleChange = (companyId: string) => {
    if (pending || companyId === company.id) return
    startTransition(async () => {
      if (await switchCompany(companyId)) return
      toast.error('Um erro inesperado aconteceu!', {
        description: 'Atualize a página e tente novamente.'
      })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton aria-busy={pending} />}>
        <Building2 />
        <span className="truncate">
          {company.name}
          <span className="sr-only"> (trocar de empresa)</span>
        </span>
        <ChevronsUpDown className="ml-auto" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={company.id} onValueChange={handleChange}>
          <DropdownMenuLabel>Empresas</DropdownMenuLabel>
          {companies.map(({ id, name }) => (
            <DropdownMenuRadioItem key={id} value={id}>
              {name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const SidebarHeader = ({
  company,
  companies
}: {
  company: TSidebarCompany
  companies: TSidebarCompany[]
}) => (
  <_SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[slot=sidebar-menu-button]:p-1.5!"
          render={<Link href="/dashboard" />}
        >
          <Clock className="size-5!" />
          <span className="text-base font-semibold">Easy Ponto</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        {companies.length > 1 ? (
          <CompanySwitcher company={company} companies={companies} />
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/70">
            <Building2 aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{company.name}</span>
          </div>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  </_SidebarHeader>
)
