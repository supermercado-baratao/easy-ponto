import { Header, MainContent } from '@/app/components'
import { adminUserModel, userModel } from '@/models'

import { SynchronizationButton } from './_components/synchronization-button'
import { UserSelector } from './_components/user-selector'

// Remove this line when authentication is implemented and the USER_ID environment variable is removed.
export const dynamic = 'force-dynamic'

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const adminUser = await adminUserModel.findUniqueById(
    process.env.ADMIN_USER_ID!
  )

  if (!adminUser.companyId)
    return <div>É necessário cadastrar uma empresa em Configurações</div>

  const users = await userModel.findManyByCompanyId(adminUser.companyId)

  return (
    <>
      <Header title="Registros de Ponto">
        {adminUser.companyId && adminUser.deviceCredentials && (
          <SynchronizationButton
            companyId={adminUser.companyId}
            deviceCredentials={adminUser.deviceCredentials}
          />
        )}
      </Header>
      <MainContent>
        <UserSelector users={users} />
        {children}
      </MainContent>
    </>
  )
}

export default Layout
