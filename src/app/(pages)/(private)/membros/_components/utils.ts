import { ADMIN_ROLE, OWNER_ROLE, VIEWER_ROLE } from '@/models/account/utils'

const ROLE_LABELS: Record<string, string> = {
  [OWNER_ROLE]: 'Proprietário',
  [ADMIN_ROLE]: 'Admin',
  [VIEWER_ROLE]: 'Visualizador'
}

export const getRoleLabel = (role: string): string => ROLE_LABELS[role] ?? role

export const ADD_MEMBER_BUTTON_ID = 'add-member'

export const getRowActionsId = (memberId: string): string =>
  `member-actions-${memberId}`
