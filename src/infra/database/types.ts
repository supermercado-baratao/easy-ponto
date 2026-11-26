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
export type Justification = typeof schema.justifications.$inferSelect
export type JustificationType = typeof schema.justificationTypes.$inferSelect
export type JustificationCodeMapping =
  typeof schema.justificationCodeMappings.$inferSelect
export type Member = typeof schema.members.$inferSelect
export type PunchRecord = typeof schema.punchRecords.$inferSelect
export type Schedule = typeof schema.schedules.$inferSelect
export type ScheduleDay = typeof schema.schedulesDays.$inferSelect
export type ShiftPattern = typeof schema.shiftPatterns.$inferSelect
export type ShiftPatternVersion =
  typeof schema.shiftPatternVersions.$inferSelect
export type ShiftPatternVersionDay =
  typeof schema.shiftPatternVersionDays.$inferSelect
export type User = typeof schema.users.$inferSelect
export type VacationPlan = typeof schema.vacationPlans.$inferSelect

type TAutomaticFields = 'id' | 'createdAt' | 'updatedAt'

export type TInputData<T> = T extends readonly (infer U)[]
  ? Omit<U, TAutomaticFields>[]
  : Omit<T, TAutomaticFields>

export type TCompanyWithDeviceCredentials = Company & {
  deviceCredentials: DeviceCredentials | null
}

export type TMemberWithCompany = Member & {
  company: TCompanyWithDeviceCredentials
}

export type TMemberWithUser = Member & {
  user: AuthUser
}

export type TScheduleWithDays = Schedule & {
  days: ScheduleDay[]
}

export type TShiftPatternVersionWithDays = ShiftPatternVersion & {
  days: ShiftPatternVersionDay[]
}

export type TShiftPatternWithVersions = ShiftPattern & {
  versions: TShiftPatternVersionWithDays[]
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
