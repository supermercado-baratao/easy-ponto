'use client'

import { PunchRecord, User } from '@prisma/client'
import { useState } from 'react'

import {
  Header,
  MainContent as _MainContent,
  Typography
} from '@/app/components'
import { TAdminUserWithRelations } from '@/models'

import { ImportFromDeviceButton } from './import-from-device-button'

export const MainContent = ({
  adminUser,
  users: _users,
  punchRecords: _punchRecords
}: {
  adminUser: TAdminUserWithRelations
  users: User[]
  punchRecords: PunchRecord[]
}) => {
  const [users, setUsers] = useState<User[]>(_users)
  const [punchRecords, setPunchRecords] = useState<PunchRecord[]>(_punchRecords)

  return (
    <>
      <Header title="Registros de Ponto">
        <ImportFromDeviceButton
          userPis={users[0].pis}
          companyId={adminUser.companyId}
          deviceCredentials={adminUser.deviceCredentials}
          pending={false}
          setUsers={setUsers}
          setPunchRecords={setPunchRecords}
        />
      </Header>
      <_MainContent>
        {users.length ? (
          <>
            <Typography component="h1" variant="h6">
              {users[0].name}
            </Typography>
            <code>
              <pre>{JSON.stringify(punchRecords, null, 2)}</pre>
            </code>
          </>
        ) : (
          <>
            <Typography component="p" variant="h6">
              Nenhum usuário encontrado
            </Typography>
            <Typography component="p" variant="base">
              Importe usuários do dispositivo para começar
            </Typography>
          </>
        )}
      </_MainContent>
    </>
  )
}
