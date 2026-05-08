// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { normalizeDatabaseUrl } from './normalize-database-url';

/** Pool size toward the DB / pooler. Hosted Postgres plans often need 1–3. */
function poolMaxFromEnv(): number {
  const raw = process.env.DATABASE_POOL_MAX;
  const n = raw !== undefined ? parseInt(raw, 10) : 1;
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return Math.min(n, 50);
}

/** Time to wait for a TCP/session (Neon resume, pooler queue, congestion). */
function poolConnectionTimeoutMs(): number {
  const raw = process.env.DATABASE_CONNECTION_TIMEOUT_MS;
  const n = raw !== undefined ? parseInt(raw, 10) : 60_000;
  if (!Number.isFinite(n) || n < 5_000) {
    return 60_000;
  }
  return Math.min(n, 120_000);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const url = normalizeDatabaseUrl(connectionString);
    const pool = new Pool({
      connectionString: url,
      max: poolMaxFromEnv(),
      connectionTimeoutMillis: poolConnectionTimeoutMs(),
      idleTimeoutMillis: 30_000,
      keepAlive: true,
    });

    super({
      adapter: new PrismaPg(pool, { disposeExternalPool: true }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
