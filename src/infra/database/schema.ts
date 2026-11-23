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

export const devicesCredentials = pgTable('devices_credentials', {
  id: id(),
  // Every device saved before the adapters is a Control iD iDClass (#96)
  model: text('model').notNull().default('control-id-idclass'),
  ip: text('ip').notNull(),
  login: text('login').notNull(),
  password: text('password').notNull(),
  ...timestamps()
})

// better-auth's organization table: the fields read from the device stay empty until the first
// synchronization, since the company is created before the device is set up
export const companies = pgTable(
  'companies',
  {
    id: id(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logo: text('logo'),
    metadata: text('metadata'),
    address: text('address'),
    cpf: text('cpf'),
    tipoDoc: integer('tipo_doc'),
    cpfCnpj: text('cpf_cnpj'),
    cei: text('cei'),
    registration: text('registration'),
    deviceCredentialsId: text('device_credentials_id'),
    ...timestamps()
  },
  (table) => [
    unique('companies_slug_key').on(table.slug),
    unique('companies_cpf_cnpj_key').on(table.cpfCnpj),
    unique('companies_device_credentials_id_key').on(table.deviceCredentialsId),
    foreignKey({
      name: 'companies_device_credentials_id_fkey',
      columns: [table.deviceCredentialsId],
      foreignColumns: [devicesCredentials.id]
    }).onDelete('set null')
  ]
)

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

export const authUsers = pgTable(
  'auth_users',
  {
    id: id(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    mustChangePassword: boolean('must_change_password')
      .notNull()
      .default(false),
    ...timestamps()
  },
  (table) => [unique('auth_users_email_key').on(table.email)]
)

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: id(),
    token: text('token').notNull(),
    expiresAt: datetime('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull(),
    activeOrganizationId: text('active_company_id'),
    ...timestamps()
  },
  (table) => [
    unique('auth_sessions_token_key').on(table.token),
    index('auth_sessions_user_id_idx').on(table.userId),
    foreignKey({
      name: 'auth_sessions_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [authUsers.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'auth_sessions_active_company_id_fkey',
      columns: [table.activeOrganizationId],
      foreignColumns: [companies.id]
    }).onDelete('set null')
  ]
)

export const authAccounts = pgTable(
  'auth_accounts',
  {
    id: id(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: datetime('access_token_expires_at'),
    refreshTokenExpiresAt: datetime('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    ...timestamps()
  },
  (table) => [
    index('auth_accounts_user_id_idx').on(table.userId),
    foreignKey({
      name: 'auth_accounts_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [authUsers.id]
    }).onDelete('cascade')
  ]
)

export const authVerifications = pgTable(
  'auth_verifications',
  {
    id: id(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: datetime('expires_at').notNull(),
    ...timestamps()
  },
  (table) => [index('auth_verifications_identifier_idx').on(table.identifier)]
)

export const members = pgTable(
  'members',
  {
    id: id(),
    role: text('role').notNull(),
    organizationId: text('company_id').notNull(),
    userId: text('auth_user_id').notNull(),
    createdAt: datetime('created_at').notNull().defaultNow()
  },
  (table) => [
    unique('members_company_id_auth_user_id_key').on(
      table.organizationId,
      table.userId
    ),
    index('members_auth_user_id_idx').on(table.userId),
    foreignKey({
      name: 'members_company_id_fkey',
      columns: [table.organizationId],
      foreignColumns: [companies.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'members_auth_user_id_fkey',
      columns: [table.userId],
      foreignColumns: [authUsers.id]
    }).onDelete('cascade')
  ]
)

export const invitations = pgTable(
  'invitations',
  {
    id: id(),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').notNull(),
    expiresAt: datetime('expires_at').notNull(),
    organizationId: text('company_id').notNull(),
    inviterId: text('inviter_id').notNull(),
    createdAt: datetime('created_at').notNull().defaultNow()
  },
  (table) => [
    index('invitations_company_id_idx').on(table.organizationId),
    foreignKey({
      name: 'invitations_company_id_fkey',
      columns: [table.organizationId],
      foreignColumns: [companies.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'invitations_inviter_id_fkey',
      columns: [table.inviterId],
      foreignColumns: [authUsers.id]
    }).onDelete('cascade')
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
    authUserId: text('auth_user_id'),
    ...timestamps()
  },
  (table) => [
    unique('users_companyId_pis_key').on(table.companyId, table.pis),
    unique('users_companyId_auth_user_id_key').on(
      table.companyId,
      table.authUserId
    ),
    index('users_companyId_idx_33acc5ed').on(table.companyId),
    foreignKey({
      name: 'users_companyId_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }),
    foreignKey({
      name: 'users_auth_user_id_fkey',
      columns: [table.authUserId],
      foreignColumns: [authUsers.id]
    }).onDelete('set null')
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
    companyId: text('company_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('punch_records_company_id_nsr_key').on(table.companyId, table.nsr),
    index('punch_records_company_id_pis_idx').on(table.companyId, table.pis),
    foreignKey({
      name: 'punch_records_company_id_pis_fkey',
      columns: [table.companyId, table.pis],
      foreignColumns: [users.companyId, users.pis]
    }).onDelete('cascade')
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

// The type each code of an imported report stands for, so an import asks only once per code (#98)
export const justificationCodeMappings = pgTable(
  'justification_code_mappings',
  {
    id: id(),
    format: text('format').notNull(),
    code: text('code').notNull(),
    companyId: text('company_id').notNull(),
    typeId: text('type_id').notNull(),
    ...timestamps()
  },
  (table) => [
    unique('justification_code_mappings_company_id_format_code_key').on(
      table.companyId,
      table.format,
      table.code
    ),
    index('justification_code_mappings_type_id_idx_907568e1').on(table.typeId),
    foreignKey({
      name: 'justification_code_mappings_company_id_fkey',
      columns: [table.companyId],
      foreignColumns: [companies.id]
    }).onDelete('cascade'),
    foreignKey({
      name: 'justification_code_mappings_type_id_fkey',
      columns: [table.typeId],
      foreignColumns: [justificationTypes.id]
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
    compensation: integer('compensation').notNull(),
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
