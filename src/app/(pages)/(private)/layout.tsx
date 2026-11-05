import { AppSidebar } from '@/app/components/block/app-sidebar/app-sidebar'
import {
  SidebarInset,
  SidebarProvider
} from '@/app/components/ui/shadcn-ui/sidebar'

const Layout = ({
  children
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)'
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
