#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a39bbebb0e2e537cd0b38a5d28cf18d4f46a0ea52cf2c5454497dff402df3681/contract';
import endContract from '../../snapshots/a39bbebb0e2e537cd0b38a5d28cf18d4f46a0ea52cf2c5454497dff402df3681/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bf3629be208d5f77c73b1a9772031290cd1e29773a647d7543d5d7a5f591a1d2/contract';
import startContract from '../../snapshots/bf3629be208d5f77c73b1a9772031290cd1e29773a647d7543d5d7a5f591a1d2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('status', 'text', {
          notNull: true,
          default: lit('registered'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
