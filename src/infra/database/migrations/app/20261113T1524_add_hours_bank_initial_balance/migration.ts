#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1634b5d68abd7d581ecb014b04a06af6b15427d45415b864bf758417c0a97327/contract';
import startContract from '../../snapshots/1634b5d68abd7d581ecb014b04a06af6b15427d45415b864bf758417c0a97327/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/bf3629be208d5f77c73b1a9772031290cd1e29773a647d7543d5d7a5f591a1d2/contract';
import endContract from '../../snapshots/bf3629be208d5f77c73b1a9772031290cd1e29773a647d7543d5d7a5f591a1d2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'hours_bank_closings',
        column: col('initial', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
