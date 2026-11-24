import { z } from 'zod'

import type { TDeviceCompany } from '@/models/device/types'

import { createSchema, saveSchema, updateSchema } from './schema'

export type TCompanyCreateData = z.input<typeof createSchema>

export type TCompanySaveData = z.input<typeof saveSchema>

export type TCompanyUpdateData = z.input<typeof updateSchema>

export type TDeviceCompanyField = keyof TDeviceCompany

export type TCompanyChange = {
  field: TDeviceCompanyField
  label: string
  current: string | null
  device: string | null
}
