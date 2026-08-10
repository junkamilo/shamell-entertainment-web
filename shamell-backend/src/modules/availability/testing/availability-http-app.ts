import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../../../common/http/apply-http-observability';
import { AvailabilityController } from '../controllers/availability.controller';
import { AvailabilityService } from '../services/availability.service';

export type AvailabilityHttpAppOptions = {
  guardsAllow: boolean;
  availabilityService: Partial<AvailabilityService> | object;
};

export async function createAvailabilityHttpApp(
  options: AvailabilityHttpAppOptions,
): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AvailabilityController],
    providers: [
      {
        provide: AvailabilityService,
        useValue: options.availabilityService,
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
