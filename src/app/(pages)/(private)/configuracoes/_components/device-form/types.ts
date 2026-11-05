import type { DeviceCredentials } from '@/infra/database/types'
import { TState } from '@/infra/form-action'
import { TDeviceCredentialsFormData } from '@/models/device-credentials/types'

export type TDeviceFormState = TState<
  TDeviceCredentialsFormData,
  DeviceCredentials
>
