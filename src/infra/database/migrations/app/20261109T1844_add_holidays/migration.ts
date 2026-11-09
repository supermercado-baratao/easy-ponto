#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/c81265e50b0fb96b20ca605dd89b7504311c520cc646e8e0e28970a049d9827e/contract';
import startContract from '../../snapshots/c81265e50b0fb96b20ca605dd89b7504311c520cc646e8e0e28970a049d9827e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d6fa4ab23a3557016a9443d738977a27b51e0c6a85fb8dd97b59143e51e8a4fa/contract';
import endContract from '../../snapshots/d6fa4ab23a3557016a9443d738977a27b51e0c6a85fb8dd97b59143e51e8a4fa/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'holidays',
        columns: [
          col('company_id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('recurring', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('scope', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'holidays',
        constraint: 'holidays_company_id_date_key',
        columns: ['company_id', 'date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'holidays',
        index: 'holidays_company_id_idx_1303a718',
        columns: ['company_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'holidays',
        foreignKey: {
          name: 'holidays_company_id_fkey',
          columns: ['company_id'],
          references: { schema: 'public', table: 'companies', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
