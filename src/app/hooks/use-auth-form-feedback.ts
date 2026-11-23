import { type RefObject, useEffect } from 'react'

import { showActionError } from '@/app/utils/action-error'
import type { TActionError } from '@/entry/action'

// The sign-in, setup and password forms redirect on success, so only the errors need feedback
export const useAuthFormFeedback = (
  state: TActionError & { errors?: object },
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

    showActionError(state)
  }, [pending, state, formReference])
}
