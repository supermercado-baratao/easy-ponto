import { revalidatePath } from 'next/cache'
import * as z from 'zod'
import { pt } from 'zod/locales'

z.config(pt())

type TAction<TInputData, TOutputData> = (
  data: TInputData
) => Promise<TOutputData>

type TError<T> = Partial<Record<keyof T, string>>

export type TState<TInputData, TOutputData> = {
  message?: string
  data?: TOutputData | null
  success?: boolean
  errors?: TError<TInputData>
  fatalError?: boolean
}

const parseFormData = <T>(formData: FormData): T =>
  Object.fromEntries(formData) as T

const parseErrors = <T>(error: z.ZodError): TError<T> => {
  const { properties } = z.treeifyError(error) as unknown as {
    properties: Record<string, { errors: string[] }>
  }
  const errors = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, value.errors[0]])
  ) as TError<T>
  return errors
}

export const handleFormAction = async <TInputData, TOutputData>(
  action: TAction<TInputData, TOutputData>,
  initialState: TState<TInputData, TOutputData>,
  formData: FormData,
  revalidationPath?: string
): Promise<TState<TInputData, TOutputData>> => {
  try {
    const formObject = parseFormData<TInputData>(formData)
    const data = await action(formObject)
    if (revalidationPath) revalidatePath(revalidationPath)
    return {
      ...initialState,
      data,
      success: true,
      errors: undefined,
      fatalError: false
    }
  } catch (error) {
    console.error(error)
    if (error instanceof z.ZodError) {
      const errors = parseErrors<TInputData>(error)
      return {
        ...initialState,
        errors,
        success: false,
        fatalError: false
      }
    }

    return {
      ...initialState,
      success: false,
      errors: undefined,
      fatalError: true
    }
  }
}
