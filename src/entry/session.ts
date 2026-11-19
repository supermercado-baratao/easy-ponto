import { isAPIError } from 'better-auth/api'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { z } from 'zod'

import { auth, type TAuthSession } from '@/infra/auth'
import type {
  TCompanyWithDeviceCredentials,
  TMemberWithCompany
} from '@/infra/database/types'
import { accountModel } from '@/models/account/model'
import type {
  TAccountSetupData,
  TChangePasswordData,
  TCpfSignInData,
  TEmailSignInData,
  TSignInCredentials
} from '@/models/account/types'
import { canEdit, EMPLOYEE_ROLE } from '@/models/account/utils'

export const SIGN_IN_PATH = '/entrar'
export const SETUP_PATH = '/configuracao-inicial'
export const CHANGE_PASSWORD_PATH = '/trocar-senha'
export const PRIVATE_HOME_PATH = '/registros-de-ponto'
export const EMPLOYEE_HOME_PATH = '/meu-ponto'

export type TCompanySession = {
  user: TAuthSession['user']
  role: string
  canEdit: boolean
  company: TCompanyWithDeviceCredentials
  companies: { id: string; name: string }[]
}

export const getSession = cache(
  async (): Promise<TAuthSession | null> =>
    await auth.api.getSession({ headers: await headers() })
)

const getMemberships = cache(
  async (authUserId: string): Promise<TMemberWithCompany[]> =>
    await accountModel.findMemberships(authUserId)
)

const getActiveMembership = async (
  session: TAuthSession
): Promise<TMemberWithCompany | null> => {
  const memberships = await getMemberships(session.user.id)
  return (
    memberships.find(
      ({ organizationId }) =>
        organizationId === session.session.activeOrganizationId
    ) ?? null
  )
}

export const getHomePath = async (): Promise<string | null> => {
  const session = await getSession()
  if (!session) return null
  if (session.user.mustChangePassword) return CHANGE_PASSWORD_PATH
  const membership = await getActiveMembership(session)
  if (!membership) return null
  return membership.role === EMPLOYEE_ROLE
    ? EMPLOYEE_HOME_PATH
    : PRIVATE_HOME_PATH
}

export const requireSession = async (): Promise<TAuthSession> => {
  const session = await getSession()
  if (!session) redirect(SIGN_IN_PATH)
  return session
}

export const requireMembership = async (): Promise<{
  session: TAuthSession
  membership: TMemberWithCompany
}> => {
  const session = await requireSession()
  if (session.user.mustChangePassword) redirect(CHANGE_PASSWORD_PATH)
  const membership = await getActiveMembership(session)
  if (!membership) redirect(SIGN_IN_PATH)
  return { session, membership }
}

export const requireCompany = async (): Promise<TCompanySession> => {
  const { session, membership } = await requireMembership()
  if (membership.role === EMPLOYEE_ROLE) redirect(EMPLOYEE_HOME_PATH)
  const memberships = await getMemberships(session.user.id)
  return {
    user: session.user,
    role: membership.role,
    canEdit: canEdit(membership.role),
    company: membership.company,
    companies: memberships
      .filter(({ role }) => role !== EMPLOYEE_ROLE)
      .map(({ company: { id, name } }) => ({ id, name }))
  }
}

export const requireEditor = async (): Promise<TCompanySession> => {
  const companySession = await requireCompany()
  if (!companySession.canEdit) redirect(PRIVATE_HOME_PATH)
  return companySession
}

const toFieldError = (field: string, message: string): z.ZodError =>
  new z.ZodError([{ code: 'custom', path: [field], message, input: undefined }])

const signIn = async (
  credentials: TSignInCredentials,
  invalidMessage: string
): Promise<void> => {
  try {
    await auth.api.signInEmail({ body: credentials, headers: await headers() })
  } catch (error) {
    if (isAPIError(error) && error.status === 'UNAUTHORIZED') {
      throw toFieldError('password', invalidMessage)
    }
    throw error
  }
}

export const signInWithEmail = async (data: TEmailSignInData): Promise<void> =>
  await signIn(
    accountModel.toEmailCredentials(data),
    'E-mail ou senha incorretos'
  )

export const signInWithCpf = async (data: TCpfSignInData): Promise<void> =>
  await signIn(accountModel.toCpfCredentials(data), 'CPF ou senha incorretos')

export const setUpFirstAccount = async (
  data: TAccountSetupData
): Promise<void> => {
  const { credentials } = await accountModel.setup(data)
  await auth.api.signInEmail({ body: credentials, headers: await headers() })
}

export const signOut = async (): Promise<void> => {
  await auth.api.signOut({ headers: await headers() })
}

export const changePassword = async (
  data: TChangePasswordData
): Promise<void> => {
  const session = await requireSession()
  const passwords = accountModel.parseChangePassword(data)
  try {
    await auth.api.changePassword({
      body: { ...passwords, revokeOtherSessions: true },
      headers: await headers()
    })
  } catch (error) {
    if (isAPIError(error) && error.status === 'BAD_REQUEST') {
      throw toFieldError('currentPassword', 'Senha atual incorreta')
    }
    throw error
  }
  await accountModel.completePasswordChange(session.user.id)
}

export const switchCompany = async (companyId: string): Promise<void> => {
  const { session } = await requireMembership()
  const memberships = await getMemberships(session.user.id)
  if (memberships.every(({ organizationId }) => organizationId !== companyId)) {
    throw new Error(
      `User ${session.user.id} is not a member of company ${companyId}`
    )
  }
  await auth.api.setActiveOrganization({
    body: { organizationId: companyId },
    headers: await headers()
  })
}
