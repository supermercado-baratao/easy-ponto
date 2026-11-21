import type { DEVICE_MODELS } from './utils'

export type TDeviceModel = (typeof DEVICE_MODELS)[number]

export type TDeviceCompany = {
  name: string
  address: string
  cpf: string
  tipoDoc: number
  cpfCnpj: string
  cei: string
}

export type TDeviceUser = {
  name: string
  pis: string
  cpf: string | null
  code: string
  registration: string
  rfid: string
  bars: string
  password: string
  templatesCount: number
}

export type TAfdQuery = {
  initialDate?: { day: number; month: number; year: number }
  initialNsr?: number
}

// The documents come with every digit (the PIS with the 12 of the AFD), whatever the device returns.
// The AFD is the file of Portaria 671, which every time clock (REP) exports, so its parsing is shared
export type TDeviceAdapter = {
  loadCompany: () => Promise<TDeviceCompany>
  loadUsers: () => Promise<TDeviceUser[]>
  loadAfd: (query: TAfdQuery) => Promise<string>
}
