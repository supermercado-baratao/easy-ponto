import { IconInnerShadowTop } from '@tabler/icons-react'
import Link from 'next/link'

import {
  SidebarHeader as _SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn-ui/sidebar'

export const SidebarHeader = () => (
  <_SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          className="data-[slot=sidebar-menu-button]:!p-1.5"
        >
          <Link href="/dashboard">
            <IconInnerShadowTop className="!size-5" />
            <span className="text-base font-semibold">Easy Ponto</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </_SidebarHeader>
)
