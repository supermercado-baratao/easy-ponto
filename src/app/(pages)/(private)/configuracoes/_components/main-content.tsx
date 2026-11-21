import { Info } from 'lucide-react'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/app/components/ui/shadcn/alert'
import type { TCompanyWithDeviceCredentials } from '@/infra/database/types'
import { isCompanyConfigured } from '@/models/company/utils'

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
      {!isCompanyConfigured(company) && (
        <Alert role="status" className="lg:col-span-2">
          <Info aria-hidden="true" />
          <AlertTitle>Configure o Easy Ponto para começar</AlertTitle>
          <AlertDescription>
            {deviceCredentials
              ? 'Importe os dados da empresa do relógio de ponto.'
              : 'Cadastre o relógio de ponto e, em seguida, importe os dados da empresa.'}
          </AlertDescription>
        </Alert>
      )}
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
