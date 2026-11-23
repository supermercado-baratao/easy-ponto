import { isAxiosError } from 'axios'

import {
  DeviceAuthenticationError,
  DeviceResponseError,
  DeviceTimeoutError,
  DeviceUnreachableError
} from '@/models/device/errors'

export const LOGIN_PATH = '/login.fcgi'

const UNREACHABLE_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN'
])

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

const UNAUTHORIZED_STATUS = 401

export const toDeviceError = (error: unknown): unknown => {
  if (!isAxiosError(error)) return error
  if (error.response) {
    // Only the login checks the login and password: a 401 on another path is about the session
    return error.response.status === UNAUTHORIZED_STATUS &&
      error.config?.url === LOGIN_PATH
      ? new DeviceAuthenticationError(error)
      : new DeviceResponseError(error)
  }
  if (error.code && TIMEOUT_CODES.has(error.code)) {
    return new DeviceTimeoutError(error)
  }
  if (error.code && UNREACHABLE_CODES.has(error.code)) {
    return new DeviceUnreachableError(error)
  }
  return new DeviceResponseError(error)
}
