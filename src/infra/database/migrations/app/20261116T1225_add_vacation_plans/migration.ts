#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/976a183aea1843400cd26ba2a3fa1f2524397a373e87a097142e7eacf7519a8e/contract';
import endContract from '../../snapshots/976a183aea1843400cd26ba2a3fa1f2524397a373e87a097142e7eacf7519a8e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a39bbebb0e2e537cd0b38a5d28cf18d4f46a0ea52cf2c5454497dff402df3681/contract';
import startContract from '../../snapshots/a39bbebb0e2e537cd0b38a5d28cf18d4f46a0ea52cf2c5454497dff402df3681/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'vacation_plans',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('justification_id', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('month', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('year', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'vacation_plans',
        constraint: 'vacation_plans_justification_id_key',
        columns: ['justification_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'vacation_plans',
        constraint: 'vacation_plans_user_id_year_key',
        columns: ['user_id', 'year'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'vacation_plans',
        index: 'vacation_plans_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'vacation_plans',
        foreignKey: {
          name: 'vacation_plans_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'vacation_plans',
        foreignKey: {
          name: 'vacation_plans_justification_id_fkey',
          columns: ['justification_id'],
          references: { schema: 'public', table: 'justifications', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
