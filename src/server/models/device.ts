import { AxiosError, AxiosInstance } from 'axios'

import { DeviceCommunicationError, InternalServerError } from '@/infra/errors'
import {
  TDeviceAboutREP,
  TDeviceCompany,
  TDeviceCredentials,
  TDeviceIdCloudStatus,
  TDevicePublicKey,
  TDeviceSystemConfiguration,
  TDeviceSystemDatetime,
  TDeviceSystemInformation,
  TDeviceUser,
  TSystemDaylightSavingTime,
  TSystemNetworkInformation,
  TUsersInfo
} from '@/shared/types/device'

class Device {
  private api: AxiosInstance

  constructor(api: AxiosInstance) {
    this.api = api

    return this.proxy()
  }

  async login(credentials: TDeviceCredentials) {
    const {
      data: { session }
    }: { data: { session: string } } = await this.api.post(
      '/login.fcgi',
      credentials
    )
    return session
  }

  async sessionIsValid(session: string) {
    const {
      data: { session_is_valid: sessionIsValid }
    }: { data: { session_is_valid: boolean } } = await this.api.post(
      this.normalizeUrl({ path: '/session_is_valid', session })
    )
    return sessionIsValid
  }

  async countUsers(session: string) {
    const {
      data: { count }
    }: { data: { count: number } } = await this.api.post(
      this.normalizeUrl({ path: '/count_users', session })
    )
    return count
  }

  async loadUsers(session: string) {
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

  async exportUsers(session: string) {
    const { data }: { data: string } = await this.api.post(
      this.normalizeUrl({ path: '/export_users_csv', session })
    )
    return data
  }

  async loadCompany(session: string) {
    const {
      data: { company }
    }: { data: { company: TDeviceCompany } } = await this.api.post(
      this.normalizeUrl({ path: '/load_company', session })
    )
    return company
  }

  async getSystemInformation(session: string) {
    const { data }: { data: TDeviceSystemInformation } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_information', session })
    )
    return data
  }

  async getAboutREP(session: string) {
    const { data }: { data: TDeviceAboutREP } = await this.api.post(
      this.normalizeUrl({ path: '/get_about', session })
    )
    return data
  }

  async getIdCloudStatus(session: string) {
    const { data }: { data: TDeviceIdCloudStatus } = await this.api.post(
      this.normalizeUrl({ path: '/get_idcloud', session })
    )
    return data
  }

  async getSystemDatetime(session: string) {
    const { data }: { data: TDeviceSystemDatetime } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_date_time', session })
    )
    return data
  }

  async getAFD({
    session,
    initialDate,
    initialNsr
  }: {
    session: string
    initialDate?: {
      day: number
      month: number
      year: number
    }
    initialNsr?: number
  }) {
    let body = undefined
    if (initialDate) body = initialDate
    if (initialNsr) body = initialNsr
    const { data }: { data: string } = await this.api.post(
      this.normalizeUrl({ path: '/get_afd', session }),
      body
    )
    return data
  }

  async getPublicKey(session: string) {
    const { data }: { data: TDevicePublicKey } = await this.api.post(
      this.normalizeUrl({ path: '/get_public_key', session })
    )
    return data
  }

  async getSystemNetworkInformation(session: string) {
    const { data }: { data: TSystemNetworkInformation } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_network', session })
    )
    return data
  }

  async getCoilPaper(session: string) {
    const {
      data: { coil_paper: coilPaper }
    }: { data: { coil_paper: number } } = await this.api.post(
      this.normalizeUrl({ path: '/get_coil_paper', session })
    )
    return coilPaper
  }

  async getSystemDaylightSavingTime(session: string) {
    const { data }: { data: TSystemDaylightSavingTime } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_daylight_saving_time', session })
    )
    return data
  }

  async getUsersInfo(session: string) {
    const { data }: { data: TUsersInfo } = await this.api.post(
      this.normalizeUrl({ path: '/get_info', session })
    )
    return data
  }

  async getSystemConfiguration(session: string) {
    const { data }: { data: TDeviceSystemConfiguration } = await this.api.post(
      this.normalizeUrl({ path: '/get_system_configuration', session })
    )
    return data
  }

  private normalizeUrl({ path, session }: { path: string; session: string }) {
    return `${path}.fcgi?session=${session}&mode=671`
  }

  private proxy() {
    return new Proxy(this, {
      get: (target, prop) => {
        const value = target[prop as keyof typeof target]

        if (typeof value !== 'function') return value

        const handler = async (...args: unknown[]) => {
          try {
            return await value.apply(target, args)
          } catch (error: unknown) {
            if (error instanceof AxiosError) {
              throw new DeviceCommunicationError({
                cause: error,
                statusCode: error.response?.status
              })
            }
            throw new InternalServerError({ cause: error })
          }
        }

        return handler
      }
    })
  }
}

export default Device
