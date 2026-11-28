import Link from 'next/link'
import { Suspense } from 'react'

import {
  SidebarContent as _SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn/sidebar'
import { useCanEdit } from '@/app/hooks/use-can-edit'

import { navItems } from './nav-items'
import {
  PendingItemsBadge,
  PendingItemsCountLabel
} from './pending-items-count'

export const SidebarContent = ({
  pendingItemsCount
}: {
  pendingItemsCount: Promise<number | null>
}) => {
  const canEdit = useCanEdit()
  return (
    <_SidebarContent>
      {navItems.map(({ section, groups }) =>
        groups.map(({ name, items }, index) => (
          <SidebarGroup key={`${section}-${index}`}>
            <SidebarGroupLabel>{name}</SidebarGroupLabel>
            <SidebarMenu>
              {items
                .filter(({ editOnly }) => canEdit || !editOnly)
                .map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton render={<Link href={item.path} />}>
                      <item.icon />
                      <span>
                        {item.title}
                        {item.showsPendingItemsCount && (
                          <Suspense>
                            <PendingItemsCountLabel count={pendingItemsCount} />
                          </Suspense>
                        )}
                      </span>
                    </SidebarMenuButton>
                    {item.showsPendingItemsCount && (
                      <Suspense>
                        <PendingItemsBadge count={pendingItemsCount} />
                      </Suspense>
                    )}
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroup>
        ))
      )}
    </_SidebarContent>
  )
}
