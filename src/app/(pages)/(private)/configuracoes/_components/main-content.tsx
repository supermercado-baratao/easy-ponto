import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { TCompanyWithDeviceCredentials } from '@/infra/database/types'

import { CompanyForm } from './company-form/form'
import { DeviceForm } from './device-form/device-form'
import { ImportFileButton } from './import-file-button/import-file-button'

export const MainContent = ({
  company: { deviceCredentials, ...company }
}: {
  company: TCompanyWithDeviceCredentials
}) => (
  <>
    <Header title="Configurações">
      {deviceCredentials && <ImportFileButton />}
    </Header>

    <_MainContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <DeviceForm
        deviceCredentials={
          deviceCredentials && {
            model: deviceCredentials.model,
            ip: deviceCredentials.ip,
            login: deviceCredentials.login,
            updatedAt: deviceCredentials.updatedAt
          }
        }
      />
      <CompanyForm company={company} hasDevice={!!deviceCredentials} />
    </_MainContent>
  </>
)
