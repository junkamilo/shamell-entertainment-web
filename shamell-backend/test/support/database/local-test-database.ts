import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Connects to the local test PostgreSQL from docker-compose.test.yml
 * (container shamell-postgres-test, port 5434) with the same adapter
 * (@prisma/adapter-pg) the backend uses in production.
 *
 * Start it first: npm run test:db:up
 */
export class LocalTestDatabase {
  public pool!: Pool;
  public prisma!: PrismaClient;

  async start(): Promise<void> {
    const url = process.env.DATABASE_URL?.trim();
    // Guard: never wipe tables on anything other than the local test DB.
    if (!url || !url.includes('localhost:5434/shamell_test')) {
      throw new Error(
        'DATABASE_URL must point to localhost:5434/shamell_test (run via npm run test:integration:local)',
      );
    }

    this.pool = new Pool({ connectionString: url, max: 2 });
    this.prisma = new PrismaClient({ adapter: new PrismaPg(this.pool) });
    await this.prisma.$connect();
  }

  /** Empties the given tables so each run starts from a clean state. */
  async truncate(...tables: string[]): Promise<void> {
    const list = tables.map((t) => `"${t}"`).join(', ');
    await this.prisma.$executeRawUnsafe(`TRUNCATE ${list} CASCADE`);
  }

  async stop(): Promise<void> {
    await this.prisma?.$disconnect();
    await this.pool?.end();
  }
}
