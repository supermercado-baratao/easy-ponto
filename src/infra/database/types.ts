import type * as schema from './schema'

export type AuthUser = typeof schema.authUsers.$inferSelect
export type Company = typeof schema.companies.$inferSelect
export type DeviceCredentials = typeof schema.devicesCredentials.$inferSelect
export type DeviceSession = typeof schema.devicesSessions.$inferSelect
export type Holiday = typeof schema.holidays.$inferSelect
export type HoursBankAdjustment =
  typeof schema.hoursBankAdjustments.$inferSelect
export type HoursBankBalance = typeof schema.hoursBankBalances.$inferSelect
export type HoursBankClosing = typeof schema.hoursBankClosings.$inferSelect
export type JobFunction = typeof schema.jobFunctions.$inferSelect
export type JourneyRules = typeof schema.journeyRules.$inferSelect
export type Justification = typeof schema.justifications.$inferSelect
export type JustificationType = typeof schema.justificationTypes.$inferSelect
export type JustificationCodeMapping =
  typeof schema.justificationCodeMappings.$inferSelect
export type Member = typeof schema.members.$inferSelect
export type OvertimeBand = typeof schema.overtimeBands.$inferSelect
export type PunchRecord = typeof schema.punchRecords.$inferSelect
export type ShiftPattern = typeof schema.shiftPatterns.$inferSelect
export type ShiftPatternVersion =
  typeof schema.shiftPatternVersions.$inferSelect
export type ShiftPatternVersionDay =
  typeof schema.shiftPatternVersionDays.$inferSelect
export type ShiftAdjustment = typeof schema.shiftAdjustments.$inferSelect
export type ShiftAssignment = typeof schema.shiftAssignments.$inferSelect
export type User = typeof schema.users.$inferSelect
export type UserGroup = typeof schema.userGroups.$inferSelect
export type UserGroupMember = typeof schema.userGroupMembers.$inferSelect
export type UserJobFunction = typeof schema.userJobFunctions.$inferSelect
export type VacationPlan = typeof schema.vacationPlans.$inferSelect

type TAutomaticFields = 'id' | 'createdAt' | 'updatedAt'

export type TInputData<T> = T extends readonly (infer U)[]
  ? Omit<U, TAutomaticFields>[]
  : Omit<T, TAutomaticFields>

// The column has a default, so the device and the report imports don't need to send it
export type TUserInputData = Omit<TInputData<User>, 'payrollPositionActive'> &
  Partial<Pick<User, 'payrollPositionActive'>>

export type TCompanyWithDeviceCredentials = Company & {
  deviceCredentials: DeviceCredentials | null
}

export type TMemberWithCompany = Member & {
  company: TCompanyWithDeviceCredentials
}

export type TMemberWithUser = Member & {
  user: AuthUser
}

export type TShiftPatternVersionWithDays = ShiftPatternVersion & {
  days: ShiftPatternVersionDay[]
}

export type TShiftPatternWithVersions = ShiftPattern & {
  versions: TShiftPatternVersionWithDays[]
}

export type TShiftAssignmentWithPattern = ShiftAssignment & {
  shiftPattern: TShiftPatternWithVersions
}

export type TJustificationWithType = Justification & {
  type: JustificationType
}

export type TVacationPlanWithJustification = VacationPlan & {
  justification: TJustificationWithType | null
}

export type THoursBankClosingWithBalances = HoursBankClosing & {
  balances: (HoursBankBalance & { user: User })[]
}
