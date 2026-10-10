import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import type { App } from 'supertest/types';
import { AdminAuthModule } from '@app/common/auth/admin-auth.module';
import { applyHttpObservability } from '@app/common/http/apply-http-observability';
import { AboutModule } from '@app/modules/about/about.module';

export async function createRealAboutHttpApp(): Promise<{ app: INestApplication<App> }> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
      AdminAuthModule,
      AboutModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication() as unknown as INestApplication<App>;
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
