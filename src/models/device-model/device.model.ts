import { AxiosInstance } from 'axios'

import {
  TDeviceAboutRep,
  TDeviceCompany,
  TDeviceIdCloudStatus,
  TDeviceLoginCredentials,
  TDevicePublicKey,
  TDeviceSystemConfiguration,
  TDeviceSystemDatetime,
  TDeviceSystemInformation,
  TDeviceUser,
  TGetAfdParams,
  TSystemDaylightSavingTime,
  TSystemNetworkInformation,
  TUsersInfo
} from './types'
import { normalizeUrl } from './utils'

const login = async (
  api: AxiosInstance,
  credentials: TDeviceLoginCredentials
): Promise<string> => {
  const {
    data: { session }
  }: { data: { session: string } } = await api.post('/login.fcgi', {
    login: credentials.login,
    password: credentials.password
  })
  return session
}

const sessionIsValid = async (
  api: AxiosInstance,
  session: string
): Promise<boolean> => {
  const {
    data: { session_is_valid: sessionIsValid }
  }: { data: { session_is_valid: boolean } } = await api.post(
    normalizeUrl({ path: '/session_is_valid', session })
  )
  return sessionIsValid
}

const countUsers = async (
  api: AxiosInstance,
  session: string
): Promise<number> => {
  const {
    data: { count }
  }: { data: { count: number } } = await api.post(
    normalizeUrl({ path: '/count_users', session })
  )
  return count
}

const loadUsers = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceUser[]> => {
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

const exportUsers = async (
  api: AxiosInstance,
  session: string
): Promise<string> => {
  const { data }: { data: string } = await api.post(
    normalizeUrl({ path: '/export_users_csv', session })
  )
  return data
}

const loadCompany = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceCompany> => {
  const {
    data: { company }
  }: { data: { company: TDeviceCompany } } = await api.post(
    normalizeUrl({ path: '/load_company', session })
  )
  return company
}

const getSystemInformation = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceSystemInformation> => {
  const { data }: { data: TDeviceSystemInformation } = await api.post(
    normalizeUrl({ path: '/get_system_information', session })
  )
  return data
}

const getAboutRep = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceAboutRep> => {
  const { data }: { data: TDeviceAboutRep } = await api.post(
    normalizeUrl({ path: '/get_about', session })
  )
  return data
}

const getIdCloudStatus = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceIdCloudStatus> => {
  const { data }: { data: TDeviceIdCloudStatus } = await api.post(
    normalizeUrl({ path: '/get_idcloud', session })
  )
  return data
}

const getSystemDatetime = async (
  api: AxiosInstance,
  session: string
): Promise<TDeviceSystemDatetime> => {
  const { data }: { data: TDeviceSystemDatetime } = await api.post(
    normalizeUrl({ path: '/get_system_date_time', session })
  )
  return data
}

const getAfd = async (
  api: AxiosInstance,
  { session, initialDate, initialNsr }: TGetAfdParams
): Promise<string> => {
  let body:
    | {
        initial_date?: { day: number; month: number; year: number }
        initial_nsr?: number
      }
    | undefined = undefined
  if (initialDate) body = { initial_date: initialDate }
  if (initialNsr) body = { ...body, initial_nsr: initialNsr }
  const { data }: { data: string } = await api.post(
    normalizeUrl({ path: '/get_afd', session }),
    body
  )
  return data
}

const getPublicKey = async (
  api: AxiosInstance,
  session: string
): Promise<TDevicePublicKey> => {
  const { data }: { data: TDevicePublicKey } = await api.post(
    normalizeUrl({ path: '/get_public_key', session })
  )
  return data
}

const getSystemNetworkInformation = async (
  api: AxiosInstance,
  session: string
): Promise<TSystemNetworkInformation> => {
  const { data }: { data: TSystemNetworkInformation } = await api.post(
    normalizeUrl({ path: '/get_system_network', session })
  )
  return data
}

const getCoilPaper = async (
  api: AxiosInstance,
  session: string
): Promise<number> => {
  const {
    data: { coil_paper: coilPaper }
  }: { data: { coil_paper: number } } = await api.post(
    normalizeUrl({ path: '/get_coil_paper', session })
  )
  return coilPaper
}

const getSystemDaylightSavingTime = async (
  api: AxiosInstance,
  session: string
): Promise<TSystemDaylightSavingTime> => {
  const { data }: { data: TSystemDaylightSavingTime } = await api.post(
    normalizeUrl({ path: '/get_system_daylight_saving_time', session })
  )
  return data
}

const getUsersInfo = async (
  api: AxiosInstance,
  session: string
): Promise<TUsersInfo> => {
  const { data }: { data: TUsersInfo } = await api.post(
    normalizeUrl({ path: '/get_info', session })
  )
  return data
}

const getSystemConfiguration = async (
  api: AxiosInstance,
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
