#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b497eb5c2464b150342243b7cea02cf37aa5df095aad0d1ce1e62b75a77613f2/contract';
import startContract from '../../snapshots/b497eb5c2464b150342243b7cea02cf37aa5df095aad0d1ce1e62b75a77613f2/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c81265e50b0fb96b20ca605dd89b7504311c520cc646e8e0e28970a049d9827e/contract';
import endContract from '../../snapshots/c81265e50b0fb96b20ca605dd89b7504311c520cc646e8e0e28970a049d9827e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'schedules',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('start_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
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
        table: 'schedules_days',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('entry_1', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('entry_2', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('entry_3', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('exit_1', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('exit_2', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('exit_3', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('schedule_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('weekday', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'schedules',
        constraint: 'schedules_user_id_start_date_key',
        columns: ['user_id', 'start_date'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'schedules_days',
        constraint: 'schedules_days_schedule_id_weekday_key',
        columns: ['schedule_id', 'weekday'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedules',
        index: 'schedules_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'schedules_days',
        index: 'schedules_days_schedule_id_idx_83757f9e',
        columns: ['schedule_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedules',
        foreignKey: {
          name: 'schedules_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'schedules_days',
        foreignKey: {
          name: 'schedules_days_schedule_id_fkey',
          columns: ['schedule_id'],
          references: { schema: 'public', table: 'schedules', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
