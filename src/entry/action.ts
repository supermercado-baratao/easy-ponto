import { KnownError } from '@/infra/errors'

export type TActionError = {
  fatalError?: boolean
  message?: string
  action?: string
}

export type TActionState<TOutputData> = TActionError & {
  data?: TOutputData | null
  success?: boolean
}

// The client only gets the message and action of a known error: any other one may expose internal details (#93)
export const toActionError = (
  error: unknown
): TActionError & { success: false } => {
  console.error(error)
  if (error instanceof KnownError) {
    return {
      success: false,
      fatalError: false,
      message: error.message,
      action: error.action
    }
  }
  return {
    success: false,
    fatalError: true,
    message: undefined,
    action: undefined
  }
}

export const handleAction = async <TOutputData>(
  action: () => Promise<TOutputData>
): Promise<TActionState<TOutputData>> => {
  try {
    const data = await action()
    return { data, success: true, fatalError: false }
  } catch (error) {
    return toActionError(error)
  }
}
