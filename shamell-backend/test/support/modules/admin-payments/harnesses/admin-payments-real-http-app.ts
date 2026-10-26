import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import type { App } from 'supertest/types';
import { AdminAuthModule } from '@app/common/auth/admin-auth.module';
import { applyHttpObservability } from '@app/common/http/apply-http-observability';
import { AdminPaymentsModule } from '@app/modules/admin-payments/admin-payments.module';

/**
 * Real admin-payments HTTP stack (controller, service, repository, floor
 * layout, JWT guard, throttler) on the local test PostgreSQL, wired like
 * main.ts (helmet, global ValidationPipe, /api/v1 prefix). Nothing is mocked.
 *
 * Each call gets its own throttler storage, so rate limits do not leak
 * between describe blocks.
 */
export async function createRealAdminPaymentsHttpApp(): Promise<{
  app: INestApplication<App>;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      AdminAuthModule,
      AdminPaymentsModule,
    ],
  }).compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api/v1');
  await app.init();

  return { app };
}
