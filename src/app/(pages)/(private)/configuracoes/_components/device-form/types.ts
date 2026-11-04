import type { DeviceCredentials } from '@/infra/database/generated/client'
import { TState } from '@/infra/form-action'
import { TDeviceCredentialsFormData } from '@/models'

export type TDeviceFormState = TState<
  TDeviceCredentialsFormData,
  DeviceCredentials
>
