import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '@app/common/http/apply-http-observability';
import { VenueTablesController } from '@app/modules/venue-tables/controllers/venue-tables.controller';
import { VenueTablesService } from '@app/modules/venue-tables/services/venue-tables.service';

export type VenueTablesHttpAppOptions = {
  guardsAllow: boolean;
  venueTablesService: Partial<VenueTablesService> | object;
};

export async function createVenueTablesHttpApp(
  options: VenueTablesHttpAppOptions,
): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [VenueTablesController],
    providers: [
      {
        provide: VenueTablesService,
        useValue: options.venueTablesService,
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
