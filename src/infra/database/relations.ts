import { defineRelations } from 'drizzle-orm'

import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  companies: {
    deviceCredentials: r.one.devicesCredentials({
      from: r.companies.deviceCredentialsId,
      to: r.devicesCredentials.id
    }),
    journeyRules: r.one.journeyRules({
      from: r.companies.id,
      to: r.journeyRules.companyId
    }),
    overtimeBands: r.many.overtimeBands({
      from: r.companies.id,
      to: r.overtimeBands.companyId
    })
  },
  members: {
    company: r.one.companies({
      from: r.members.organizationId,
      to: r.companies.id,
      optional: false
    }),
    user: r.one.authUsers({
      from: r.members.userId,
      to: r.authUsers.id,
      optional: false
    })
  },
  shiftPatterns: {
    versions: r.many.shiftPatternVersions({
      from: r.shiftPatterns.id,
      to: r.shiftPatternVersions.shiftPatternId
    })
  },
  shiftPatternVersions: {
    shiftPattern: r.one.shiftPatterns({
      from: r.shiftPatternVersions.shiftPatternId,
      to: r.shiftPatterns.id,
      optional: false
    }),
    days: r.many.shiftPatternVersionDays({
      from: r.shiftPatternVersions.id,
      to: r.shiftPatternVersionDays.versionId
    })
  },
  restRules: {
    shiftPatterns: r.many.restRuleShiftPatterns({
      from: r.restRules.id,
      to: r.restRuleShiftPatterns.restRuleId
    }),
    constraints: r.many.restRuleConstraints({
      from: r.restRules.id,
      to: r.restRuleConstraints.restRuleId
    })
  },
  shiftAssignments: {
    shiftPattern: r.one.shiftPatterns({
      from: r.shiftAssignments.shiftPatternId,
      to: r.shiftPatterns.id,
      optional: false
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
  userGroupMembers: {
    group: r.one.userGroups({
      from: r.userGroupMembers.groupId,
      to: r.userGroups.id,
      optional: false
    })
  },
  userJobFunctions: {
    jobFunction: r.one.jobFunctions({
      from: r.userJobFunctions.jobFunctionId,
      to: r.jobFunctions.id,
      optional: false
    })
  },
  pendingItemDismissals: {
    dismissedBy: r.one.authUsers({
      from: r.pendingItemDismissals.dismissedById,
      to: r.authUsers.id
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
