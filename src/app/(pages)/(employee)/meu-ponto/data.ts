import { requireMembership } from '@/entry/session'

export const getEmployeeHomePageData = async (): Promise<{
  name: string
  companyName: string
}> => {
  const { session, membership } = await requireMembership()
  return { name: session.user.name, companyName: membership.company.name }
}
