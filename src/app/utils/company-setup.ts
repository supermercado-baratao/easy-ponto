import type { TCompanySetupStep } from '@/models/company/utils'

export const COMPANY_SETUP_STEP_LABELS: Record<TCompanySetupStep, string> = {
  device: 'Cadastre o relógio de ponto.',
  company: 'Sincronize os dados da empresa com o relógio de ponto.',
  'overtime-bands': 'Informe os adicionais de hora extra de cada tipo de dia.'
}
