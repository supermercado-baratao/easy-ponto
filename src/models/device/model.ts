import type { DeviceCredentials } from '@/infra/database/types'

import { createControlIdAdapter } from './adapters/control-id/adapter'
import { DeviceNotConfiguredError, UnsupportedDeviceModelError } from './errors'
import type { TDeviceAdapter, TDeviceModel } from './types'

const ADAPTERS: Record<
  TDeviceModel,
  (credentials: DeviceCredentials) => TDeviceAdapter
> = {
  'control-id-idclass': createControlIdAdapter
}

const connect = (credentials: DeviceCredentials | null): TDeviceAdapter => {
  if (!credentials) throw new DeviceNotConfiguredError()
  const createAdapter = ADAPTERS[credentials.model as TDeviceModel]
  if (!createAdapter) throw new UnsupportedDeviceModelError(credentials.model)
  return createAdapter(credentials)
}

export const deviceModel = {
  connect
}
