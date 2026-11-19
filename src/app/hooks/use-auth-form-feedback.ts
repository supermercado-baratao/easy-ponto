import { type RefObject, useEffect } from 'react'
import { toast } from 'sonner'

// The sign-in, setup and password forms redirect on success, so only the errors need feedback
export const useAuthFormFeedback = (
  state: { errors?: object; fatalError?: boolean },
  pending: boolean,
  formReference: RefObject<HTMLFormElement | null>
) => {
  useEffect(() => {
    if (pending) return

    if (state.errors) {
      formReference.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus()
      return
    }

    if (!state.fatalError) return

    toast.error('Um erro inesperado aconteceu!', {
      description: 'Atualize a página e tente novamente.'
    })
  }, [pending, state, formReference])
}
