import { TState } from '@/entry/form-action'
import type { DeviceCredentials } from '@/infra/database/types'
import { TDeviceCredentialsFormData } from '@/models/device-credentials/types'

export type TDeviceFormState = Omit<
  TState<TDeviceCredentialsFormData, DeviceCredentials>,
  'data'
> & {
  values?: Partial<Record<'model' | 'ip' | 'login', string>>
}

export type TDeviceFormValues = Pick<
  DeviceCredentials,
  'model' | 'ip' | 'login' | 'updatedAt'
>
