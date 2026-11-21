import type { TDeviceModel } from './types'

export const DEVICE_MODELS = ['control-id-idclass'] as const

export const DEFAULT_DEVICE_MODEL: TDeviceModel = 'control-id-idclass'

export const DEVICE_MODEL_LABELS: Record<TDeviceModel, string> = {
  'control-id-idclass': 'Control iD iDClass'
}
