import { TState } from '@/entry/form-action'
import type { DeviceCredentials } from '@/infra/database/types'
import { TDeviceCredentialsFormData } from '@/models/device-credentials/types'

export type TDeviceFormState = Omit<
  TState<TDeviceCredentialsFormData, DeviceCredentials>,
  'data'
>

export type TDeviceFormValues = Pick<
  DeviceCredentials,
  'ip' | 'login' | 'updatedAt'
>
