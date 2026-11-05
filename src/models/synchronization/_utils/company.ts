import { CNPJ_LENGTH, CPF_LENGTH } from '@/constants/length'
import type { Company } from '@/infra/database/types'
import { TDeviceCompany } from '@/models/device/types'
import { TInputData } from '@/types/generics'
import { normalizeLeftZeros } from '@/utils/normalize'

export const mapDeviceCompanyToCompany = (
  deviceCompany: TDeviceCompany
): TInputData<Company> => ({
  address: deviceCompany.address,
  cei: deviceCompany.cei.toString(),
  cpf: normalizeLeftZeros(deviceCompany.cpf, CPF_LENGTH),
  cpfCnpj: normalizeLeftZeros(
    deviceCompany.cpf_cnpj,
    deviceCompany.tipo_doc === 1 ? CNPJ_LENGTH : CPF_LENGTH
  ),
  name: deviceCompany.name,
  tipoDoc: deviceCompany.tipo_doc,
  registration: null
})
