import { Info } from 'lucide-react'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/app/components/ui/shadcn/alert'
import type {
  JourneyRules,
  OvertimeBand,
  TCompanyWithDeviceCredentials
} from '@/infra/database/types'
import { isCompanyConfigured } from '@/models/company/utils'
import { hasOvertimeBands } from '@/models/journey-rules/utils'

import { CompanyForm } from './company-form/form'
import { DeviceForm } from './device-form/device-form'
import { ImportFileButton } from './import-file-button/import-file-button'
import { JourneyRulesForm } from './journey-rules-form/journey-rules-form'
import { OvertimeBandsForm } from './overtime-bands-form/overtime-bands-form'

const getPendingSteps = (
  company: Pick<TCompanyWithDeviceCredentials, 'cpfCnpj' | 'deviceCredentials'>,
  overtimeBands: OvertimeBand[]
): string[] =>
  [
    !company.deviceCredentials && 'Cadastre o relógio de ponto.',
    !company.cpfCnpj &&
      'Sincronize os dados da empresa com o relógio de ponto.',
    !hasOvertimeBands(overtimeBands) &&
      'Informe os adicionais de hora extra de cada tipo de dia.'
  ].filter((step) => typeof step === 'string')

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
              {getPendingSteps(
                { ...company, deviceCredentials },
                overtimeBands
              ).map((step) => (
                <li key={step}>{step}</li>
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
