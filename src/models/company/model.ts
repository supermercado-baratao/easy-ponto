import type {
  Company,
  TCompanyWithDeviceCredentials
} from '@/infra/database/types'
import { DEFAULT_JOURNEY_RULES } from '@/models/journey-rules/utils'
import { DEFAULT_JUSTIFICATION_TYPES } from '@/models/justification-type/utils'
import { companyRepository } from '@/repositories/company-repository'

import { createSchema, saveSchema, updateSchema } from './schema'
import {
  TCompanyCreateData,
  TCompanySaveData,
  TCompanyUpdateData
} from './types'
import { toSlug } from './utils'

const create = async (data: TCompanyCreateData): Promise<Company> => {
  const company = createSchema.parse(data)
  return await companyRepository.create({
    company: { ...company, slug: toSlug(company.name) },
    justificationTypes: DEFAULT_JUSTIFICATION_TYPES,
    journeyRules: DEFAULT_JOURNEY_RULES
  })
}

const findUniqueById = async (
  id: string
): Promise<TCompanyWithDeviceCredentials> => {
  const company = await companyRepository.findUniqueById(id)
  if (!company) throw new Error(`Company ${id} not found`)
  return company
}

const update = async (data: TCompanyUpdateData): Promise<Company> => {
  const { id, ...company } = updateSchema.parse(data)
  const result = await companyRepository.update(id, company)
  if (!result) throw new Error(`Company ${id} not found`)
  return result
}

const save = async (data: TCompanySaveData): Promise<Company> => {
  const { id, registration = null, ...company } = saveSchema.parse(data)
  const result = await companyRepository.update(id, {
    ...company,
    registration
  })
  if (!result) throw new Error(`Company ${id} not found`)
  return result
}

export const companyModel = {
  create,
  findUniqueById,
  save,
  update
}
