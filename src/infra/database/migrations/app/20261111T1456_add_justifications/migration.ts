#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c497a7b28aa28c759c8b9a2ebdde75a04210c37a43e3813723a9f7016998c1b3/contract';
import endContract from '../../snapshots/c497a7b28aa28c759c8b9a2ebdde75a04210c37a43e3813723a9f7016998c1b3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d6fa4ab23a3557016a9443d738977a27b51e0c6a85fb8dd97b59143e51e8a4fa/contract';
import startContract from '../../snapshots/d6fa4ab23a3557016a9443d738977a27b51e0c6a85fb8dd97b59143e51e8a4fa/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'justification_types',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('company_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('effect', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
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
        table: 'justifications',
        columns: [
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('end_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('end_time', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('start_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('start_time', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('type_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('user_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'justification_types',
        constraint: 'justification_types_company_id_code_key',
        columns: ['company_id', 'code'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'justification_types',
        index: 'justification_types_company_id_idx_1303a718',
        columns: ['company_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'justifications',
        index: 'justifications_type_id_idx_907568e1',
        columns: ['type_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'justifications',
        index: 'justifications_user_id_idx_6c952402',
        columns: ['user_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'justification_types',
        foreignKey: {
          name: 'justification_types_company_id_fkey',
          columns: ['company_id'],
          references: { schema: 'public', table: 'companies', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'justifications',
        foreignKey: {
          name: 'justifications_user_id_fkey',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'justifications',
        foreignKey: {
          name: 'justifications_type_id_fkey',
          columns: ['type_id'],
          references: { schema: 'public', table: 'justification_types', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
