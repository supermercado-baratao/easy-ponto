import { getMissingSetupSteps } from '@/models/company/utils'

import type { TPendingItemDetector } from '../types'

export const detectCompanySetup: TPendingItemDetector = ({
  company,
  overtimeBands
}) =>
  getMissingSetupSteps(company, overtimeBands).map((step) => ({
    key: `company-setup:${step}`,
    type: 'company-setup',
    step
  }))
