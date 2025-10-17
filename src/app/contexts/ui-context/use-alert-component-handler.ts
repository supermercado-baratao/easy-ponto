import { useCallback, useEffect, useMemo, useState } from 'react'

import { TAlertAttributes } from '@/app/components'

type TAlertContextAttributes = TAlertAttributes & {
  autoHideDuration?: number
}

export type TAlertContext = {
  open: (attributes: TAlertAttributes) => void
  close: () => void
}

export const useAlertComponentHandler = () => {
  const [alertAttributes, setAlertAttributes] =
    useState<TAlertContextAttributes | null>(null)

  useEffect(() => {
    if (!alertAttributes) return

    const timer = setTimeout(() => {
      setAlertAttributes(null)
    }, alertAttributes.autoHideDuration || 4000)

    return () => clearTimeout(timer)
  }, [alertAttributes])

  const open = useCallback((attributes: TAlertContextAttributes) => {
    setAlertAttributes(attributes)
  }, [])

  const close = useCallback(() => {
    setAlertAttributes(null)
  }, [])

  const alert = useMemo(() => ({ open, close }), [open, close])

  return {
    alertAttributes,
    alert
  }
}
