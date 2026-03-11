import {
  TDeviceAboutRep,
  TDeviceCompany,
  TDeviceIdCloudStatus,
  TDevicePublicKey,
  TDeviceSystemConfiguration,
  TDeviceSystemDatetime,
  TDeviceSystemInformation,
  TDeviceUser,
  TGetAfdParams,
  TLoginCredentials,
  TSystemDaylightSavingTime,
  TSystemNetworkInformation,
  TUsersInfo
} from './types'
import { createDeviceApiInstance, normalizeUrl } from './utils'

const api = createDeviceApiInstance(process.env.DEVICE_BASE_URL as string)

const login = async (credentials: TLoginCredentials): Promise<string> => {
  const {
    data: { session }
  }: { data: { session: string } } = await api.post('/login.fcgi', credentials)
  return session
}

const sessionIsValid = async (session: string): Promise<boolean> => {
  const {
    data: { session_is_valid: sessionIsValid }
  }: { data: { session_is_valid: boolean } } = await api.post(
    normalizeUrl({ path: '/session_is_valid', session })
  )
  return sessionIsValid
}

const countUsers = async (session: string): Promise<number> => {
  const {
    data: { count }
  }: { data: { count: number } } = await api.post(
    normalizeUrl({ path: '/count_users', session })
  )
  return count
}

const loadUsers = async (session: string): Promise<TDeviceUser[]> => {
  const {
    data: { users }
  }: { data: { users: TDeviceUser[] } } = await api.post(
    normalizeUrl({ path: '/load_users', session }),
    {
      limit: 100,
      offset: 0
    }
  )
  return users
}

const exportUsers = async (session: string): Promise<string> => {
  const { data }: { data: string } = await api.post(
    normalizeUrl({ path: '/export_users_csv', session })
  )
  return data
}

const loadCompany = async (session: string): Promise<TDeviceCompany> => {
  const {
    data: { company }
  }: { data: { company: TDeviceCompany } } = await api.post(
    normalizeUrl({ path: '/load_company', session })
  )
  return company
}

const getSystemInformation = async (
  session: string
): Promise<TDeviceSystemInformation> => {
  const { data }: { data: TDeviceSystemInformation } = await api.post(
    normalizeUrl({ path: '/get_system_information', session })
  )
  return data
}

const getAboutRep = async (session: string): Promise<TDeviceAboutRep> => {
  const { data }: { data: TDeviceAboutRep } = await api.post(
    normalizeUrl({ path: '/get_about', session })
  )
  return data
}

const getIdCloudStatus = async (
  session: string
): Promise<TDeviceIdCloudStatus> => {
  const { data }: { data: TDeviceIdCloudStatus } = await api.post(
    normalizeUrl({ path: '/get_idcloud', session })
  )
  return data
}

const getSystemDatetime = async (
  session: string
): Promise<TDeviceSystemDatetime> => {
  const { data }: { data: TDeviceSystemDatetime } = await api.post(
    normalizeUrl({ path: '/get_system_date_time', session })
  )
  return data
}

const getAfd = async ({
  session,
  initialDate,
  initialNsr
}: TGetAfdParams): Promise<string> => {
  let body = undefined
  if (initialDate) body = initialDate
  if (initialNsr) body = initialNsr
  const { data }: { data: string } = await api.post(
    normalizeUrl({ path: '/get_afd', session }),
    body
  )
  return data
}

const getPublicKey = async (session: string): Promise<TDevicePublicKey> => {
  const { data }: { data: TDevicePublicKey } = await api.post(
    normalizeUrl({ path: '/get_public_key', session })
  )
  return data
}

const getSystemNetworkInformation = async (
  session: string
): Promise<TSystemNetworkInformation> => {
  const { data }: { data: TSystemNetworkInformation } = await api.post(
    normalizeUrl({ path: '/get_system_network', session })
  )
  return data
}

const getCoilPaper = async (session: string): Promise<number> => {
  const {
    data: { coil_paper: coilPaper }
  }: { data: { coil_paper: number } } = await api.post(
    normalizeUrl({ path: '/get_coil_paper', session })
  )
  return coilPaper
}

const getSystemDaylightSavingTime = async (
  session: string
): Promise<TSystemDaylightSavingTime> => {
  const { data }: { data: TSystemDaylightSavingTime } = await api.post(
    normalizeUrl({ path: '/get_system_daylight_saving_time', session })
  )
  return data
}

const getUsersInfo = async (session: string): Promise<TUsersInfo> => {
  const { data }: { data: TUsersInfo } = await api.post(
    normalizeUrl({ path: '/get_info', session })
  )
  return data
}

const getSystemConfiguration = async (
  session: string
): Promise<TDeviceSystemConfiguration> => {
  const { data }: { data: TDeviceSystemConfiguration } = await api.post(
    normalizeUrl({ path: '/get_system_configuration', session })
  )
  return data
}

export const deviceModel = {
  login,
  sessionIsValid,
  countUsers,
  loadUsers,
  exportUsers,
  loadCompany,
  getSystemInformation,
  getAboutRep,
  getIdCloudStatus,
  getSystemDatetime,
  getAfd,
  getPublicKey,
  getSystemNetworkInformation,
  getCoilPaper,
  getSystemDaylightSavingTime,
  getUsersInfo,
  getSystemConfiguration
}
