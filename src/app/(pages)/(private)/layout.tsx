import { AppSidebar } from '@/app/components/blocks/app-sidebar/app-sidebar'
import { PermissionsProvider } from '@/app/components/providers/permissions-provider'
import {
  SidebarInset,
  SidebarProvider
} from '@/app/components/ui/shadcn/sidebar'
import { requireCompany } from '@/entry/session'

import { countPendingItems } from './data'

const Layout = async ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  const { company, companies, canEdit } = await requireCompany()
  // Not awaited, so the page doesn't wait for the count
  const pendingItemsCount = countPendingItems({
    companyId: company.id,
    canEdit
  })
  return (
    <PermissionsProvider canEdit={canEdit}>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)'
          } as React.CSSProperties
        }
      >
        <AppSidebar
          variant="inset"
          company={{ id: company.id, name: company.name }}
          companies={companies}
          pendingItemsCount={pendingItemsCount}
        />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  )
}

export default Layout
