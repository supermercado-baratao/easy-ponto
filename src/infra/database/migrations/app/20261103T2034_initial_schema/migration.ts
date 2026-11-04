#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b497eb5c2464b150342243b7cea02cf37aa5df095aad0d1ce1e62b75a77613f2/contract';
import endContract from '../../snapshots/b497eb5c2464b150342243b7cea02cf37aa5df095aad0d1ce1e62b75a77613f2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'admin_users',
        columns: [
          col('companyId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('deviceCredentialsId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'companies',
        columns: [
          col('address', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cei', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cpf', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cpf_cnpj', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('registration', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tipo_doc', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'devices_credentials',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('ip', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('login', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'devices_sessions',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('deviceCredentialsId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('token', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'punch_records',
        columns: [
          col('afd_datetime', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('datetime', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('hexadecimal_check_digit', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nsr', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('pis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('registration_type', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('admin_user_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('admission_date', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('bars', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('companyId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('cpf', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('department', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('payroll_number', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('pis', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('registration', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rfid', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('templates_count', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'companies',
        constraint: 'companies_cpf_cnpj_key',
        columns: ['cpf_cnpj'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'devices_sessions',
        constraint: 'devices_sessions_deviceCredentialsId_key',
        columns: ['deviceCredentialsId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'punch_records',
        constraint: 'punch_records_nsr_key',
        columns: ['nsr'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_pis_key',
        columns: ['pis'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_admin_user_id_key',
        columns: ['admin_user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'admin_users',
        index: 'admin_users_companyId_idx_33acc5ed',
        columns: ['companyId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'admin_users',
        index: 'admin_users_deviceCredentialsId_idx_c948dafc',
        columns: ['deviceCredentialsId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'punch_records',
        index: 'punch_records_pis_idx_b1390a89',
        columns: ['pis'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_companyId_idx_33acc5ed',
        columns: ['companyId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'admin_users',
        foreignKey: {
          name: 'admin_users_companyId_fkey',
          columns: ['companyId'],
          references: { schema: 'public', table: 'companies', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'admin_users',
        foreignKey: {
          name: 'admin_users_deviceCredentialsId_fkey',
          columns: ['deviceCredentialsId'],
          references: { schema: 'public', table: 'devices_credentials', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'devices_sessions',
        foreignKey: {
          name: 'devices_sessions_deviceCredentialsId_fkey',
          columns: ['deviceCredentialsId'],
          references: { schema: 'public', table: 'devices_credentials', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'punch_records',
        foreignKey: {
          name: 'punch_records_pis_fkey',
          columns: ['pis'],
          references: { schema: 'public', table: 'users', columns: ['pis'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'users',
        foreignKey: {
          name: 'users_companyId_fkey',
          columns: ['companyId'],
          references: { schema: 'public', table: 'companies', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'users',
        foreignKey: {
          name: 'users_admin_user_id_fkey',
          columns: ['admin_user_id'],
          references: { schema: 'public', table: 'admin_users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
