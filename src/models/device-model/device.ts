import { AxiosInstance } from 'axios'

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

interface IDeviceModel {
  login(credentials: TLoginCredentials): Promise<string>
  sessionIsValid(session: string): Promise<boolean>
  countUsers(session: string): Promise<number>
  loadUsers(session: string): Promise<TDeviceUser[]>
  exportUsers(session: string): Promise<string>
  loadCompany(session: string): Promise<TDeviceCompany>
  getSystemInformation(session: string): Promise<TDeviceSystemInformation>
  getAboutRep(session: string): Promise<TDeviceAboutRep>
  getIdCloudStatus(session: string): Promise<TDeviceIdCloudStatus>
  getSystemDatetime(session: string): Promise<TDeviceSystemDatetime>
  getAfd({ session, initialDate, initialNsr }: TGetAfdParams): Promise<string>
  getPublicKey(session: string): Promise<TDevicePublicKey>
  getSystemNetworkInformation(
    session: string
  ): Promise<TSystemNetworkInformation>
  getCoilPaper(session: string): Promise<number>
  getSystemDaylightSavingTime(
    session: string
  ): Promise<TSystemDaylightSavingTime>
  getUsersInfo(session: string): Promise<TUsersInfo>
  getSystemConfiguration(session: string): Promise<TDeviceSystemConfiguration>
}

export class DeviceModel implements IDeviceModel {
  private api: AxiosInstance

  constructor(api: AxiosInstance) {
    this.api = api
  }

  async login(credentials: TLoginCredentials): Promise<string> {
    const {
      data: { session }
    }: { data: { session: string } } = await this.api.post(
      '/login.fcgi',
      credentials
    )
    return session
  }

  async sessionIsValid(session: string): Promise<boolean> {
    const {
      data: { session_is_valid: sessionIsValid }
    }: { data: { session_is_valid: boolean } } = await this.api.post(
      this.normalizeUrl({ path: '/session_is_valid', session })
    )
    return sessionIsValid
  }

  async countUsers(session: string): Promise<number> {
    const {
      data: { count }
    }: { data: { count: number } } = await this.api.post(
      this.normalizeUrl({ path: '/count_users', session })
    )
    return count
  }

  async loadUsers(session: string): Promise<TDeviceUser[]> {
    const {
      data: { users }
    }: { data: { users: TDeviceUser[] } } = await this.api.post(
      this.normalizeUrl({ path: '/load_users', session }),
      {
        limit: 100,
        offset: 0
      }
    )
    return users
  }

  async exportUsers(session: string): Promise<string> {
    const { data }: { data: string } = await this.api.post(
      this.normalizeUrl({ path: '/export_users_csv', session })
    )
    return data
  }

  async loadCompany(session: string): Promise<TDeviceCompany> {
    const {
      data: { company }
    }: { data: { company: TDeviceCompany } } = await this.api.post(
      this.normalizeUrl({ path: '/load_company', session })
    )
    return company
  }

  async getSystemInformation(
    session: string
  ): Promise<TDeviceSystemInformation> {
    const { data }: { data: TDeviceSystemInformation } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_information', session })
    )
    return data
  }

  async getAboutRep(session: string): Promise<TDeviceAboutRep> {
    const { data }: { data: TDeviceAboutRep } = await this.api.post(
      this.normalizeUrl({ path: '/get_about', session })
    )
    return data
  }

  async getIdCloudStatus(session: string): Promise<TDeviceIdCloudStatus> {
    const { data }: { data: TDeviceIdCloudStatus } = await this.api.post(
      this.normalizeUrl({ path: '/get_idcloud', session })
    )
    return data
  }

  async getSystemDatetime(session: string): Promise<TDeviceSystemDatetime> {
    const { data }: { data: TDeviceSystemDatetime } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_date_time', session })
    )
    return data
  }

  async getAfd({
    session,
    initialDate,
    initialNsr
  }: TGetAfdParams): Promise<string> {
    let body = undefined
    if (initialDate) body = initialDate
    if (initialNsr) body = initialNsr
    const { data }: { data: string } = await this.api.post(
      this.normalizeUrl({ path: '/get_afd', session }),
      body
    )
    return data
  }

  async getPublicKey(session: string): Promise<TDevicePublicKey> {
    const { data }: { data: TDevicePublicKey } = await this.api.post(
      this.normalizeUrl({ path: '/get_public_key', session })
    )
    return data
  }

  async getSystemNetworkInformation(
    session: string
  ): Promise<TSystemNetworkInformation> {
    const { data }: { data: TSystemNetworkInformation } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_network', session })
    )
    return data
  }

  async getCoilPaper(session: string): Promise<number> {
    const {
      data: { coil_paper: coilPaper }
    }: { data: { coil_paper: number } } = await this.api.post(
      this.normalizeUrl({ path: '/get_coil_paper', session })
    )
    return coilPaper
  }

  async getSystemDaylightSavingTime(
    session: string
  ): Promise<TSystemDaylightSavingTime> {
    const { data }: { data: TSystemDaylightSavingTime } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_daylight_saving_time', session })
    )
    return data
  }

  async getUsersInfo(session: string): Promise<TUsersInfo> {
    const { data }: { data: TUsersInfo } = await this.api.post(
      this.normalizeUrl({ path: '/get_info', session })
    )
    return data
  }

  async getSystemConfiguration(
    session: string
  ): Promise<TDeviceSystemConfiguration> {
    const { data }: { data: TDeviceSystemConfiguration } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_configuration', session })
    )
    return data
  }

  private normalizeUrl({ path, session }: { path: string; session: string }) {
    return `${path}.fcgi?session=${session}&mode=671`
  }
}
