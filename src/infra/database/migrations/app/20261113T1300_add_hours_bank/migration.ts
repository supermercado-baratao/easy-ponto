#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1634b5d68abd7d581ecb014b04a06af6b15427d45415b864bf758417c0a97327/contract';
import endContract from '../../snapshots/1634b5d68abd7d581ecb014b04a06af6b15427d45415b864bf758417c0a97327/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c497a7b28aa28c759c8b9a2ebdde75a04210c37a43e3813723a9f7016998c1b3/contract';
import startContract from '../../snapshots/c497a7b28aa28c759c8b9a2ebdde75a04210c37a43e3813723a9f7016998c1b3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'hours_bank_adjustments',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('minutes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('reason', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'hours_bank_balances',
        columns: [
          col('absence', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('adjustment', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('balance', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('closing_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('day_off', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lateness', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('overtime_100', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('overtime_60', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('previous_balance', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'hours_bank_closings',
        columns: [
          col('company_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('end_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('start_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'hours_bank_balances',
        constraint: 'hours_bank_balances_closing_id_user_id_key',
        columns: ['closing_id', 'user_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'hours_bank_closings',
        constraint: 'hours_bank_closings_company_id_end_date_key',
        columns: ['company_id', 'end_date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hours_bank_adjustments',
        index: 'hours_bank_adjustments_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hours_bank_balances',
        index: 'hours_bank_balances_closing_id_idx_67d1d3e9',
        columns: ['closing_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hours_bank_balances',
        index: 'hours_bank_balances_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hours_bank_closings',
        index: 'hours_bank_closings_company_id_idx_1303a718',
        columns: ['company_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hours_bank_adjustments',
        foreignKey: {
          name: 'hours_bank_adjustments_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hours_bank_balances',
        foreignKey: {
          name: 'hours_bank_balances_closing_id_fkey',
          columns: ['closing_id'],
          references: { schema: 'public', table: 'hours_bank_closings', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hours_bank_balances',
        foreignKey: {
          name: 'hours_bank_balances_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hours_bank_closings',
        foreignKey: {
          name: 'hours_bank_closings_company_id_fkey',
          columns: ['company_id'],
          references: { schema: 'public', table: 'companies', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
