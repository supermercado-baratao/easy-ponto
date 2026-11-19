import { getHomePath, requireSession, SIGN_IN_PATH } from '@/entry/session'

export const getChangePasswordPageData = async (): Promise<{
  mustChangePassword: boolean
  homePath: string
}> => {
  const { user } = await requireSession()
  return {
    mustChangePassword: !!user.mustChangePassword,
    homePath: (await getHomePath()) ?? SIGN_IN_PATH
  }
}
