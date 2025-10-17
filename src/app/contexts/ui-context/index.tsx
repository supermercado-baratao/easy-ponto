'use client'

import { createContext, useContext } from 'react'

import { Alert, TAlertAttributes } from '@/app/components'

import {
  TAlertContext,
  useAlertComponentHandler
} from './use-alert-component-handler'

type TUIContext = {
  alert: TAlertContext
}

const UIContext = createContext<TUIContext>({} as TUIContext)

export const useUIContext = () => useContext(UIContext)

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const { alertAttributes, alert } = useAlertComponentHandler()

  return (
    <UIContext.Provider value={{ alert }}>
      {children}
      <Alert
        {...(alertAttributes as TAlertAttributes)}
        open={!!alertAttributes}
        handleClose={alert.close}
      />
    </UIContext.Provider>
  )
}
