import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { organization } from 'better-auth/plugins/organization'

import { database } from './database/client'
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
  companies,
  invitations,
  members
} from './database/schema'

const findFirstCompanyId = async (userId: string): Promise<string | null> => {
  const member = await database.query.members.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  })
  return member?.organizationId ?? null
}

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
      organization: companies,
      member: members,
      invitation: invitations
    }
  }),
  // There is no public sign-up: the first admin comes from /configuracao-inicial and the employees'
  // accounts from the synchronization (#77)
  emailAndPassword: { enabled: true, disableSignUp: true },
  user: {
    additionalFields: {
      mustChangePassword: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false
      }
    }
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => ({
          data: {
            ...session,
            activeOrganizationId: await findFirstCompanyId(session.userId)
          }
        })
      }
    }
  },
  advanced: { database: { generateId: 'uuid' } },
  plugins: [
    organization({ allowUserToCreateOrganization: false }),
    nextCookies()
  ]
})

export type TAuthSession = typeof auth.$Infer.Session
