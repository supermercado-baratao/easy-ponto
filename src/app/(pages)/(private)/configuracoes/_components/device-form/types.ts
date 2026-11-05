import { TState } from '@/entry/form-action'
import type { DeviceCredentials } from '@/infra/database/types'
import { TDeviceCredentialsFormData } from '@/models/device-credentials/types'

export type TDeviceFormState = TState<
  TDeviceCredentialsFormData,
  DeviceCredentials
>
