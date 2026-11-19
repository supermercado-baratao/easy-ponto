import { use } from 'react'

import { PermissionsContext } from '@/app/components/providers/permissions-provider'

export const useCanEdit = () => use(PermissionsContext).canEdit
