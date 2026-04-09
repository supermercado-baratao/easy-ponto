import { DeviceCredentials } from '@prisma/client'

import { TState } from '@/infra/form-action'
import { TDeviceCredentialsFormData } from '@/models'

export type TDeviceFormState = TState<
  TDeviceCredentialsFormData,
  DeviceCredentials
>
