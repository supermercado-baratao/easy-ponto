import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, test } from 'vitest'

import {
  DeviceAuthenticationError,
  DeviceResponseError,
  DeviceTimeoutError,
  DeviceUnreachableError
} from '@/models/device/errors'

import { LOGIN_PATH, toDeviceError } from './errors'

const createError = ({
  url = '/load_company.fcgi',
  code,
  status
}: {
  url?: string
  code?: string
  status?: number
}): AxiosError =>
  new AxiosError(
    'Request failed',
    code,
    { url } as AxiosError['config'],
    undefined,
    status ? ({ status } as AxiosResponse) : undefined
  )

describe('Control iD errors', () => {
  test('Turns a 401 of the login into wrong credentials', () => {
    expect(
      toDeviceError(createError({ url: LOGIN_PATH, status: 401 }))
    ).toBeInstanceOf(DeviceAuthenticationError)
  })

  test('Turns a 401 of another path into an unexpected response', () => {
    expect(toDeviceError(createError({ status: 401 }))).toBeInstanceOf(
      DeviceResponseError
    )
  })

  test('Turns an error status into an unexpected response', () => {
    expect(toDeviceError(createError({ status: 500 }))).toBeInstanceOf(
      DeviceResponseError
    )
  })

  test.each(['ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND'])(
    'Turns %s into an unreachable device',
    (code) => {
      expect(toDeviceError(createError({ code }))).toBeInstanceOf(
        DeviceUnreachableError
      )
    }
  )

  test.each(['ECONNABORTED', 'ETIMEDOUT'])(
    'Turns %s into a device that took too long',
    (code) => {
      expect(toDeviceError(createError({ code }))).toBeInstanceOf(
        DeviceTimeoutError
      )
    }
  )

  test('Turns an unknown failure without a response into an unexpected response', () => {
    expect(toDeviceError(createError({ code: 'EPROTO' }))).toBeInstanceOf(
      DeviceResponseError
    )
  })

  test('Keeps an error that does not come from the request', () => {
    const error = new TypeError('Cannot read properties of undefined')

    expect(toDeviceError(error)).toBe(error)
  })
})
