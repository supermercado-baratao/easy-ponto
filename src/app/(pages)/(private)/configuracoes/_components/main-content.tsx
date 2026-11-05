'use client'

import { useState } from 'react'

import { Header } from '@/app/components/block/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { Company, DeviceCredentials } from '@/infra/database/types'
import { TAdminUserWithRelations } from '@/models/admin-user/types'

import { CompanyForm } from './company-form/form'
import { DeviceForm } from './device-form/device-form'
import { ImportFileButton } from './import-file-button/import-file-button'

export const MainContent = ({
  adminUser
}: {
  adminUser: TAdminUserWithRelations
}) => {
  const [deviceCredentials, setDeviceCredentials] =
    useState<DeviceCredentials | null>(adminUser.deviceCredentials)
  const [company, setCompany] = useState<Company | null>(adminUser.company)

  return (
    <>
      <Header title="Configurações">
        {company && deviceCredentials && (
          <ImportFileButton
            company={company}
            credentials={deviceCredentials}
            setCompany={setCompany}
          />
        )}
      </Header>

      <_MainContent className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DeviceForm
          adminUserId={adminUser.id}
          deviceCredentials={deviceCredentials}
          setDeviceCredentials={setDeviceCredentials}
        />
        <CompanyForm
          adminUserId={adminUser.id}
          company={adminUser.company}
          deviceCredentials={deviceCredentials}
          setCompany={setCompany}
        />
      </_MainContent>
    </>
  )
}
