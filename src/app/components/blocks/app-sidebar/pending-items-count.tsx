'use client'

import { use } from 'react'

import { SidebarMenuBadge } from '@/app/components/ui/shadcn/sidebar'

type TPendingItemsCountProps = { count: Promise<number | null> }

export const PendingItemsBadge = ({ count }: TPendingItemsCountProps) => {
  const value = use(count)
  return value ? (
    <SidebarMenuBadge aria-hidden="true">{value}</SidebarMenuBadge>
  ) : null
}

// The badge sits beside the link, so the link carries the count for screen readers
export const PendingItemsCountLabel = ({ count }: TPendingItemsCountProps) => {
  const value = use(count)
  return value ? (
    <span className="sr-only">
      {' '}
      ({value === 1 ? '1 aberta' : `${value} abertas`})
    </span>
  ) : null
}
