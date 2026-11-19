'use client'

import { createContext } from 'react'

export const PermissionsContext = createContext({ canEdit: false })

export const PermissionsProvider = ({
  canEdit,
  children
}: {
  canEdit: boolean
  children: React.ReactNode
}) => (
  <PermissionsContext.Provider value={{ canEdit }}>
    {children}
  </PermissionsContext.Provider>
)
