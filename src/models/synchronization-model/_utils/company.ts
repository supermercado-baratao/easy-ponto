import { Company } from '@prisma/client'

import { CNPJ_LENGTH, CPF_LENGTH } from '@/constants'
import { TDeviceCompany } from '@/models'
import { TInputData } from '@/types'
import { normalizeLeftZeros } from '@/utils'

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
