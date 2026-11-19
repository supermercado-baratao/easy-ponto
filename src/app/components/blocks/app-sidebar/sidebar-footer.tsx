import { SignOutButton } from '@/app/components/blocks/sign-out/sign-out-button'
import { ToggleTheme } from '@/app/components/blocks/toggle-theme'
import { GitHub } from '@/app/components/ui/icons/github'
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
  () => <SignOutButton variant="sidebar" />,
  () => (
    <SidebarMenuButton
      render={
        <a
          href="https://github.com/supermercado-baratao/easy-ponto"
          target="_blank"
          rel="noopener noreferrer"
        />
      }
    >
      <GitHub />
      <span>GitHub</span>
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
