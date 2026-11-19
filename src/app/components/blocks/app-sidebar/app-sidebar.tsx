'use client'

import { Separator } from '@/app/components/ui/shadcn/separator'
import { Sidebar } from '@/app/components/ui/shadcn/sidebar'

import { SidebarContent } from './sidebar-content'
import { SidebarFooter } from './sidebar-footer'
import { SidebarHeader } from './sidebar-header'
import type { TSidebarCompany } from './types'

export const AppSidebar = ({
  company,
  companies,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  company: TSidebarCompany
  companies: TSidebarCompany[]
}) => {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader company={company} companies={companies} />
      <Separator />
      <SidebarContent />
      <Separator />
      <SidebarFooter />
    </Sidebar>
  )
}
