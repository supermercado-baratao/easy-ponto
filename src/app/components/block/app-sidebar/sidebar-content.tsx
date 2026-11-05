import Link from 'next/link'

import {
  SidebarContent as _SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn-ui/sidebar'

import { navItems } from './nav-items'

export const SidebarContent = () => (
  <_SidebarContent>
    {navItems.map(({ section, groups }) =>
      groups.map(({ name, items }, index) => (
        <SidebarGroup key={`${section}-${index}`}>
          <SidebarGroupLabel>{name}</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild>
                  <Link href={item.path}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))
    )}
  </_SidebarContent>
)
