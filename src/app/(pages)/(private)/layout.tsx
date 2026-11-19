import { AppSidebar } from '@/app/components/blocks/app-sidebar/app-sidebar'
import { PermissionsProvider } from '@/app/components/providers/permissions-provider'
import {
  SidebarInset,
  SidebarProvider
} from '@/app/components/ui/shadcn/sidebar'
import { requireCompany } from '@/entry/session'

const Layout = async ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  const { company, companies, canEdit } = await requireCompany()
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
        />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  )
}

export default Layout
