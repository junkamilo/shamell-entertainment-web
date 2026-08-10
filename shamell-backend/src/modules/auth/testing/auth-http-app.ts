import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { RequirePermissionsGuard } from '../../../common/auth/guards/require-permissions.guard';
import { applyHttpObservability } from '../../../common/http/apply-http-observability';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

export type AuthHttpAppOptions = {
  guardsAllow: boolean;
  authService: Partial<AuthService> | object;
};

export async function createAuthHttpApp(options: AuthHttpAppOptions): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      {
        provide: AuthService,
        useValue: options.authService,
      },
    ],
  })
    .overrideGuard(AdminJwtGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { adminUser?: { id: string; email: string } };
        };
      }) => {
        if (!options.guardsAllow) {
          return false;
        }
        const req = context.switchToHttp().getRequest();
        req.adminUser = {
          id: 'admin-e2e-test',
          email: 'admin-e2e@test.local',
        };
        return true;
      },
    })
    .overrideGuard(RequirePermissionsGuard)
    .useValue({ canActivate: () => options.guardsAllow })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();
  return { app, moduleRef };
}
