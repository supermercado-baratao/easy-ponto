/**
Documentation: https://www.controlid.com.br/suporte/api_idclass_latest.html#index
*/

export type TDeviceLoginCredentials = {
  login: string
  password: string
}

export type TGetAfdParams = {
  session: string
  initialDate?: {
    day: number
    month: number
    year: number
  }
  initialNsr?: number
}

export type TDeviceUser = {
  name: string
  pis: number
  cpf?: number
  code: number
  templates_count: number
  password: string
  admin: boolean
  rfid: number
  bars: string
  registration: number
}

export type TDeviceCompany = {
  name: string
  address: string
  cpf: number
  tipo_doc: number
  cpf_cnpj: number
  cei: number
}

export type TDeviceSystemInformation = {
  user_count: number
  template_count: number
  uptime: number
  ticks: number
  cuts: number
  coil_paper: number
  total_paper: number
  paper_ok: boolean
  low_paper: boolean | null
  memory: number
  used_mrp: number
  last_nsr: number
}

export type TDeviceAboutRep = {
  mac: string
  nSerie: string
  versionFW: number
  versionMRP: number
}

export type TDeviceIdCloudStatus = {
  enable: boolean
  interval: number
}

export type TDeviceSystemDatetime = {
  day: number // day of month
  month: number // January is 1
  year: number
  hour: number
  minute: number
  second: number
}

export type TDevicePublicKey = {
  base32: string
  base64: string
}

export type TSystemNetworkInformation = {
  ip: string
  netmask: string
  gateway: string
  dns: string
}

export type TSystemDaylightSavingTime = {
  start_date_time: {
    year: number
    month: number
    day: number
  }
  end_date_time: {
    year: number
    month: number
    day: number
  }
}

export type TUsersInfo = {
  num_serie: string
  user_count: number
  administrator_count: number
  template_count: number
  password_count: number
  bars_count: number
  rfid_count: number
  uptime: number
  low_on_paper: boolean | null
  cuts: number
  total_printed: number
}

export type TDeviceSystemConfig = {
  beep_enabled: boolean
  animation_enabled: boolean
  economic_receipt_enabled: boolean
  one_to_one_enabled: boolean
}
