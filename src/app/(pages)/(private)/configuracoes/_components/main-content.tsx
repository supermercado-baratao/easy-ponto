import { Info } from 'lucide-react'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/app/components/ui/shadcn/alert'
import { COMPANY_SETUP_STEP_LABELS } from '@/app/utils/company-setup'
import type {
  JourneyRules,
  OvertimeBand,
  TCompanyWithDeviceCredentials
} from '@/infra/database/types'
import {
  getMissingSetupSteps,
  isCompanyConfigured
} from '@/models/company/utils'

import { CompanyForm } from './company-form/form'
import { DeviceForm } from './device-form/device-form'
import { ImportFileButton } from './import-file-button/import-file-button'
import { JourneyRulesForm } from './journey-rules-form/journey-rules-form'
import { OvertimeBandsForm } from './overtime-bands-form/overtime-bands-form'

export const MainContent = ({
  company: { deviceCredentials, ...company },
  journeyRules,
  overtimeBands
}: {
  company: TCompanyWithDeviceCredentials
  journeyRules: JourneyRules
  overtimeBands: OvertimeBand[]
}) => (
  <>
    <Header title="Configurações">
      {deviceCredentials && <ImportFileButton />}
    </Header>

    <_MainContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {!isCompanyConfigured(company, overtimeBands) && (
        <Alert role="status" className="lg:col-span-2">
          <Info aria-hidden="true" />
          <AlertTitle>Configure o Easy Ponto para começar</AlertTitle>
          <AlertDescription>
            <ul className="list-inside list-disc">
              {getMissingSetupSteps(company, overtimeBands).map((step) => (
                <li key={step}>{COMPANY_SETUP_STEP_LABELS[step]}</li>
              ))}
            </ul>
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
      <JourneyRulesForm journeyRules={journeyRules} />
      <OvertimeBandsForm overtimeBands={overtimeBands} />
    </_MainContent>
  </>
)
