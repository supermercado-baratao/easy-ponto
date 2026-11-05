'use client'

import { Separator } from '@/app/components/ui/shadcn/separator'
import { Sidebar } from '@/app/components/ui/shadcn/sidebar'

import { SidebarContent } from './sidebar-content'
import { SidebarFooter } from './sidebar-footer'
import { SidebarHeader } from './sidebar-header'

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader />
      <Separator />
      <SidebarContent />
      <Separator />
      <SidebarFooter />
    </Sidebar>
  )
}
