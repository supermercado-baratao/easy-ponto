import { randomUUID } from 'node:crypto'

import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique
} from 'drizzle-orm/pg-core'

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => randomUUID())

const datetime = (name: string) =>
  timestamp(name, { precision: 3, withTimezone: true })

const dateOnly = (name: string) => date(name, { mode: 'string' })

const timestamps = () => ({
  createdAt: datetime('created_at').notNull().defaultNow(),
  updatedAt: datetime('updated_at')
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
})

export const companies = pgTable(
  'companies',
  {
    id: id(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    cpf: text('cpf').notNull(),
    tipoDoc: integer('tipo_doc').notNull(),
    cpfCnpj: text('cpf_cnpj').notNull(),
    cei: text('cei').notNull(),
    registration: text('registration'),
    ...timestamps()
  },
  (table) => [unique('companies_cpf_cnpj_key').on(table.cpfCnpj)]
)

export const devicesCredentials = pgTable('devices_credentials', {
  id: id(),
  ip: text('ip').notNull(),
  login: text('login').notNull(),
  password: text('password').notNull(),
  ...timestamps()
})

export const devicesSessions = pgTable(
  'devices_sessions',
  {
    id: id(),
    token: text('token').notNull(),
    deviceCredentialsId: text('deviceCredentialsId').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('devices_sessions_deviceCredentialsId_key').on(
      table.deviceCredentialsId
    ),
    foreignKey({
      name: 'devices_sessions_deviceCredentialsId_fkey',
      columns: [table.deviceCredentialsId],
      foreignColumns: [devicesCredentials.id]
    })
  ]
)

export const adminUsers = pgTable(
  'admin_users',
  {
    id: id(),
    companyId: text('companyId'),
    deviceCredentialsId: text('deviceCredentialsId'),
    ...timestamps()
  },
  (table) => [
    index('admin_users_companyId_idx_33acc5ed').on(table.companyId),
    index('admin_users_deviceCredentialsId_idx_c948dafc').on(
      table.deviceCredentialsId
    ),
    foreignKey({
      name: 'admin_users_companyId_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }),
    foreignKey({
      name: 'admin_users_deviceCredentialsId_fkey',
      columns: [table.deviceCredentialsId],
      foreignColumns: [devicesCredentials.id]
    })
  ]
)

export const users = pgTable(
  'users',
  {
    id: id(),
    name: text('name').notNull(),
    pis: text('pis').notNull(),
    cpf: text('cpf'),
    code: text('code').notNull(),
    templatesCount: integer('templates_count').notNull(),
    password: text('password').notNull(),
    rfid: text('rfid').notNull(),
    bars: text('bars').notNull(),
    registration: text('registration').notNull(),
    payrollNumber: text('payroll_number'),
    admissionDate: datetime('admission_date'),
    position: text('position'),
    department: text('department'),
    status: text('status').notNull().default('registered'),
    companyId: text('companyId').notNull(),
    adminUserId: text('admin_user_id'),
    ...timestamps()
  },
  (table) => [
    unique('users_pis_key').on(table.pis),
    unique('users_admin_user_id_key').on(table.adminUserId),
    index('users_companyId_idx_33acc5ed').on(table.companyId),
    foreignKey({
      name: 'users_companyId_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }),
    foreignKey({
      name: 'users_admin_user_id_fkey',
      columns: [table.adminUserId],
      foreignColumns: [adminUsers.id]
    })
  ]
)

export const punchRecords = pgTable(
  'punch_records',
  {
    id: id(),
    pis: text('pis').notNull(),
    datetime: datetime('datetime').notNull(),
    afdDatetime: datetime('afd_datetime'),
    nsr: integer('nsr'),
    registrationType: text('registration_type'),
    hexadecimalCheckDigit: text('hexadecimal_check_digit'),
    ...timestamps()
  },
  (table) => [
    unique('punch_records_nsr_key').on(table.nsr),
    index('punch_records_pis_idx_b1390a89').on(table.pis),
    foreignKey({
      name: 'punch_records_pis_fkey',
      columns: [table.pis],
      foreignColumns: [users.pis]
    })
  ]
)

export const schedules = pgTable(
  'schedules',
  {
    id: id(),
    startDate: dateOnly('start_date').notNull(),
    userId: text('user_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('schedules_user_id_start_date_key').on(
      table.userId,
      table.startDate
    ),
    index('schedules_user_id_idx_6c952402').on(table.userId),
    foreignKey({
      name: 'schedules_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [users.id]
    }).onDelete('cascade')
  ]
)

export const schedulesDays = pgTable(
  'schedules_days',
  {
    id: id(),
    weekday: integer('weekday').notNull(),
    entry1: integer('entry_1'),
    exit1: integer('exit_1'),
    entry2: integer('entry_2'),
    exit2: integer('exit_2'),
    entry3: integer('entry_3'),
    exit3: integer('exit_3'),
    scheduleId: text('schedule_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('schedules_days_schedule_id_weekday_key').on(
      table.scheduleId,
      table.weekday
    ),
    index('schedules_days_schedule_id_idx_83757f9e').on(table.scheduleId),
    foreignKey({
      name: 'schedules_days_schedule_id_fkey',
      columns: [table.scheduleId],
      foreignColumns: [schedules.id]
    }).onDelete('cascade')
  ]
)

export const holidays = pgTable(
  'holidays',
  {
    id: id(),
    date: dateOnly('date').notNull(),
    name: text('name').notNull(),
    scope: text('scope').notNull(),
    recurring: boolean('recurring').notNull(),
    companyId: text('company_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('holidays_company_id_date_key').on(table.companyId, table.date),
    index('holidays_company_id_idx_1303a718').on(table.companyId),
    foreignKey({
      name: 'holidays_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }).onDelete('cascade')
  ]
)

export const justificationTypes = pgTable(
  'justification_types',
  {
    id: id(),
    code: text('code').notNull(),
    description: text('description').notNull(),
    effect: text('effect').notNull(),
    companyId: text('company_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('justification_types_company_id_code_key').on(
      table.companyId,
      table.code
    ),
    index('justification_types_company_id_idx_1303a718').on(table.companyId),
    foreignKey({
      name: 'justification_types_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }).onDelete('cascade')
  ]
)

export const justifications = pgTable(
  'justifications',
  {
    id: id(),
    startDate: dateOnly('start_date').notNull(),
    endDate: dateOnly('end_date').notNull(),
    startTime: integer('start_time'),
    endTime: integer('end_time'),
    note: text('note'),
    userId: text('user_id').notNull(),
    typeId: text('type_id').notNull(),
    ...timestamps()
  },
  (table) => [
    index('justifications_user_id_idx_6c952402').on(table.userId),
    index('justifications_type_id_idx_907568e1').on(table.typeId),
    foreignKey({
      name: 'justifications_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [users.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'justifications_type_id_fkey',
      columns: [table.typeId],
      foreignColumns: [justificationTypes.id]
    })
  ]
)

export const hoursBankClosings = pgTable(
  'hours_bank_closings',
  {
    id: id(),
    startDate: dateOnly('start_date').notNull(),
    endDate: dateOnly('end_date').notNull(),
    initial: boolean('initial').notNull().default(false),
    companyId: text('company_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('hours_bank_closings_company_id_end_date_key').on(
      table.companyId,
      table.endDate
    ),
    index('hours_bank_closings_company_id_idx_1303a718').on(table.companyId),
    foreignKey({
      name: 'hours_bank_closings_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }).onDelete('cascade')
  ]
)

export const hoursBankBalances = pgTable(
  'hours_bank_balances',
  {
    id: id(),
    previousBalance: integer('previous_balance').notNull(),
    absence: integer('absence').notNull(),
    lateness: integer('lateness').notNull(),
    dayOff: integer('day_off').notNull(),
    overtime60: integer('overtime_60').notNull(),
    overtime100: integer('overtime_100').notNull(),
    adjustment: integer('adjustment').notNull(),
    balance: integer('balance').notNull(),
    closingId: text('closing_id').notNull(),
    userId: text('user_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('hours_bank_balances_closing_id_user_id_key').on(
      table.closingId,
      table.userId
    ),
    index('hours_bank_balances_closing_id_idx_67d1d3e9').on(table.closingId),
    index('hours_bank_balances_user_id_idx_6c952402').on(table.userId),
    foreignKey({
      name: 'hours_bank_balances_closing_id_fkey',
      columns: [table.closingId],
      foreignColumns: [hoursBankClosings.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'hours_bank_balances_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [users.id]
    }).onDelete('cascade')
  ]
)

export const hoursBankAdjustments = pgTable(
  'hours_bank_adjustments',
  {
    id: id(),
    date: dateOnly('date').notNull(),
    minutes: integer('minutes').notNull(),
    reason: text('reason').notNull(),
    userId: text('user_id').notNull(),
    ...timestamps()
  },
  (table) => [
    index('hours_bank_adjustments_user_id_idx_6c952402').on(table.userId),
    foreignKey({
      name: 'hours_bank_adjustments_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [users.id]
    }).onDelete('cascade')
  ]
)

export const vacationPlans = pgTable(
  'vacation_plans',
  {
    id: id(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    userId: text('user_id').notNull(),
    justificationId: text('justification_id'),
    ...timestamps()
  },
  (table) => [
    unique('vacation_plans_user_id_year_key').on(table.userId, table.year),
    unique('vacation_plans_justification_id_key').on(table.justificationId),
    index('vacation_plans_user_id_idx_6c952402').on(table.userId),
    foreignKey({
      name: 'vacation_plans_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [users.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'vacation_plans_justification_id_fkey',
      columns: [table.justificationId],
      foreignColumns: [justifications.id]
    }).onDelete('set null')
  ]
)
