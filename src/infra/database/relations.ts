import { defineRelations } from 'drizzle-orm'

import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  adminUsers: {
    company: r.one.companies({
      from: r.adminUsers.companyId,
      to: r.companies.id
    }),
    deviceCredentials: r.one.devicesCredentials({
      from: r.adminUsers.deviceCredentialsId,
      to: r.devicesCredentials.id
    }),
    user: r.one.users({
      from: r.adminUsers.id,
      to: r.users.adminUserId
    })
  },
  schedules: {
    days: r.many.schedulesDays({
      from: r.schedules.id,
      to: r.schedulesDays.scheduleId
    })
  },
  justifications: {
    type: r.one.justificationTypes({
      from: r.justifications.typeId,
      to: r.justificationTypes.id,
      optional: false
    })
  },
  vacationPlans: {
    justification: r.one.justifications({
      from: r.vacationPlans.justificationId,
      to: r.justifications.id
    })
  },
  hoursBankClosings: {
    balances: r.many.hoursBankBalances({
      from: r.hoursBankClosings.id,
      to: r.hoursBankBalances.closingId
    })
  },
  hoursBankBalances: {
    user: r.one.users({
      from: r.hoursBankBalances.userId,
      to: r.users.id,
      optional: false
    })
  }
}))
