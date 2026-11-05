import { Clock } from 'lucide-react'
import Link from 'next/link'

import {
  SidebarHeader as _SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn/sidebar'

export const SidebarHeader = () => (
  <_SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          className="data-[slot=sidebar-menu-button]:!p-1.5"
          render={<Link href="/dashboard" />}
        >
          <Clock className="!size-5" />
          <span className="text-base font-semibold">Easy Ponto</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </_SidebarHeader>
)
