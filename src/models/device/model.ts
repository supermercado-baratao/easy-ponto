import type { DeviceCredentials } from '@/infra/database/types'

import { createControlIdAdapter } from './adapters/control-id/adapter'
import type { TDeviceAdapter, TDeviceModel } from './types'

const ADAPTERS: Record<
  TDeviceModel,
  (credentials: DeviceCredentials) => TDeviceAdapter
> = {
  'control-id-idclass': createControlIdAdapter
}

const connect = (credentials: DeviceCredentials): TDeviceAdapter => {
  const createAdapter = ADAPTERS[credentials.model as TDeviceModel]
  if (!createAdapter) {
    throw new Error(`Device model ${credentials.model} has no adapter`)
  }
  return createAdapter(credentials)
}

export const deviceModel = {
  connect
}
