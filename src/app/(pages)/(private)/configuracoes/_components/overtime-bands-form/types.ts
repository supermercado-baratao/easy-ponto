import type { TState } from '@/entry/form-action'
import type { OvertimeBand } from '@/infra/database/types'
import type { TOvertimeBandsFormData } from '@/models/journey-rules/types'

export type TOvertimeBandsFormState = TState<
  TOvertimeBandsFormData,
  OvertimeBand[]
> & { values?: Record<string, string> }
