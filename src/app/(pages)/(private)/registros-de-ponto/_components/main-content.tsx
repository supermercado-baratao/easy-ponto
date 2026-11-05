'use client'

import { useState } from 'react'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { User } from '@/infra/database/types'
import { TAdminUserWithRelations } from '@/models/admin-user/types'
import { TUserWithPunchRecords } from '@/models/user/types'

import { SynchronizationButton } from './synchronization-button/synchronization-button'

export const MainContent = ({
  adminUser,
  users: _users,
  user: _user
}: {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: TUserWithPunchRecords | null
}) => {
  const [users, setUsers] = useState<User[]>(_users)
  const [user, setUser] = useState<TUserWithPunchRecords | null>(_user)

  return (
    <>
      <Header title="Registros de Ponto">
        {adminUser.companyId && adminUser.deviceCredentials && (
          <SynchronizationButton
            userPis={user?.pis || null}
            companyId={adminUser.companyId}
            deviceCredentials={adminUser.deviceCredentials}
            pending={false}
            setUsers={setUsers}
            setUser={setUser}
          />
        )}
      </Header>
      <_MainContent>
        {users.length && user ? (
          <>
            <Typography component="h1" variant="h6">
              {user.name}
            </Typography>
            <code>
              <pre>{JSON.stringify(user!.punchRecords, null, 2)}</pre>
            </code>
          </>
        ) : (
          <>
            <Typography component="p" variant="h6">
              Nenhum usuário encontrado
            </Typography>
            <Typography component="p" variant="base">
              Cadastre ou importe usuários do dispositivo para começar
            </Typography>
          </>
        )}
      </_MainContent>
    </>
  )
}
