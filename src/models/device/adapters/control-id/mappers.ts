import { CNPJ_LENGTH, CPF_LENGTH, PIS_LENGTH } from '@/constants/length'
import { normalizeLeftZeros } from '@/infra/normalize'
import type { TDeviceCompany, TDeviceUser } from '@/models/device/types'

import type { TControlIdCompany, TControlIdUser } from './types'

// The device returns the documents as numbers, which drop the leading zeros
export const mapControlIdCompany = (
  company: TControlIdCompany
): TDeviceCompany => ({
  name: company.name,
  address: company.address,
  cpf: normalizeLeftZeros(company.cpf, CPF_LENGTH),
  tipoDoc: company.tipo_doc,
  cpfCnpj: normalizeLeftZeros(
    company.cpf_cnpj,
    company.tipo_doc === 1 ? CNPJ_LENGTH : CPF_LENGTH
  ),
  cei: company.cei.toString()
})

export const mapControlIdUser = (user: TControlIdUser): TDeviceUser => ({
  name: user.name,
  pis: normalizeLeftZeros(user.pis, PIS_LENGTH),
  cpf: user.cpf ? normalizeLeftZeros(user.cpf, CPF_LENGTH) : null,
  code: user.code.toString(),
  registration: user.registration.toString(),
  rfid: user.rfid.toString(),
  bars: user.bars.toString(),
  password: user.password,
  templatesCount: user.templates_count
})
