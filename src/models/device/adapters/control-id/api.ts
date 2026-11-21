import https from 'node:https'

import axios, { type AxiosInstance } from 'axios'

import {
  TControlIdAboutRep,
  TControlIdAfdParams,
  TControlIdCompany,
  TControlIdIdCloudStatus,
  TControlIdLoginCredentials,
  TControlIdPublicKey,
  TControlIdSystemConfig,
  TControlIdSystemDatetime,
  TControlIdSystemInformation,
  TControlIdUser,
  TSystemDaylightSavingTime,
  TSystemNetworkInformation,
  TUsersInfo
} from './types'

// The device answers over HTTPS with a self-signed certificate and non-standard HTTP
export const createApiInstance = (ip: string): AxiosInstance =>
  axios.create({
    baseURL: `https://${ip}`,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    insecureHTTPParser: true
  })

// `mode=671` asks for the AFD of Portaria 671
const normalizeUrl = ({
  path,
  session
}: {
  path: string
  session: string
}): string => `${path}.fcgi?session=${session}&mode=671`

// Maximum accepted by the device API
const USERS_PER_REQUEST = 100

const login = async (
  api: AxiosInstance,
  credentials: TControlIdLoginCredentials
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
): Promise<TControlIdUser[]> => {
  const count = await countUsers(api, session)
  const users: TControlIdUser[] = []

  for (let offset = 0; offset < count; offset += USERS_PER_REQUEST) {
    const {
      data: { users: page }
    }: { data: { users: TControlIdUser[] } } = await api.post(
      normalizeUrl({ path: '/load_users', session }),
      {
        limit: USERS_PER_REQUEST,
        offset
      }
    )
    users.push(...page)
  }

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
): Promise<TControlIdCompany> => {
  const {
    data: { company }
  }: { data: { company: TControlIdCompany } } = await api.post(
    normalizeUrl({ path: '/load_company', session })
  )
  return company
}

const getSystemInformation = async (
  api: AxiosInstance,
  session: string
): Promise<TControlIdSystemInformation> => {
  const { data }: { data: TControlIdSystemInformation } = await api.post(
    normalizeUrl({ path: '/get_system_information', session })
  )
  return data
}

const getAboutRep = async (
  api: AxiosInstance,
  session: string
): Promise<TControlIdAboutRep> => {
  const { data }: { data: TControlIdAboutRep } = await api.post(
    normalizeUrl({ path: '/get_about', session })
  )
  return data
}

const getIdCloudStatus = async (
  api: AxiosInstance,
  session: string
): Promise<TControlIdIdCloudStatus> => {
  const { data }: { data: TControlIdIdCloudStatus } = await api.post(
    normalizeUrl({ path: '/get_idcloud', session })
  )
  return data
}

const getSystemDatetime = async (
  api: AxiosInstance,
  session: string
): Promise<TControlIdSystemDatetime> => {
  const { data }: { data: TControlIdSystemDatetime } = await api.post(
    normalizeUrl({ path: '/get_system_date_time', session })
  )
  return data
}

const getAfd = async (
  api: AxiosInstance,
  { session, initialDate, initialNsr }: TControlIdAfdParams
): Promise<string> => {
  let body:
    | {
        initial_date?: { day: number; month: number; year: number }
        initial_nsr?: number
      }
    | undefined
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
): Promise<TControlIdPublicKey> => {
  const { data }: { data: TControlIdPublicKey } = await api.post(
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

const getSystemConfig = async (
  api: AxiosInstance,
  session: string
): Promise<TControlIdSystemConfig> => {
  const { data }: { data: TControlIdSystemConfig } = await api.post(
    normalizeUrl({ path: '/get_system_configuration', session })
  )
  return data
}

export const controlIdApi = {
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
  getSystemConfig
}
