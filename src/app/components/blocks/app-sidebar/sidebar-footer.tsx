import { LogOut } from 'lucide-react'

import { ToggleTheme } from '@/app/components/blocks/toggle-theme'
import { GitLab } from '@/app/components/ui/icons/gitlab'
import {
  SidebarFooter as _SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/app/components/ui/shadcn/sidebar'

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <SidebarMenu>
    <SidebarMenuItem>{children}</SidebarMenuItem>
  </SidebarMenu>
)

export const items = [
  () => <ToggleTheme variant="sidebar" />,
  () => (
    <SidebarMenuButton render={<div />}>
      <LogOut />
      <span>Sair</span>
    </SidebarMenuButton>
  ),
  () => (
    <SidebarMenuButton
      render={
        <a
          href="https://github.com/diasjoaovitor"
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      <GitLab />
      <span>GitLab</span>
    </SidebarMenuButton>
  )
]

export const SidebarFooter = () => {
  return (
    <_SidebarFooter>
      {items.map((Item, index) => (
        <Wrapper key={index}>
          <Item />
        </Wrapper>
      ))}
    </_SidebarFooter>
  )
}
