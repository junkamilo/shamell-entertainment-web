import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../../../common/http/apply-http-observability';
import { UpcomingEventsController } from '../controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from '../services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../services/admin-fixed-event-enrollment.service';
import { UpcomingEventsService } from '../services/upcoming-events.service';

export type UpcomingEventsHttpAppOptions = {
  guardsAllow: boolean;
  upcomingEventsService: Partial<UpcomingEventsService> | object;
  adminClassEnrollment?: Partial<AdminClassEnrollmentService> | object;
  adminFixedEventEnrollment?:
    | Partial<AdminFixedEventEnrollmentService>
    | object;
};

export async function createUpcomingEventsHttpApp(
  options: UpcomingEventsHttpAppOptions,
): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [UpcomingEventsController],
    providers: [
      {
        provide: UpcomingEventsService,
        useValue: options.upcomingEventsService,
      },
      {
        provide: AdminClassEnrollmentService,
        useValue: options.adminClassEnrollment ?? {
          listAdminBookableClassEvents: jest.fn(),
          createAdminClassCashEnrollment: jest.fn(),
          createAdminClassCheckoutSession: jest.fn(),
        },
      },
      {
        provide: AdminFixedEventEnrollmentService,
        useValue: options.adminFixedEventEnrollment ?? {
          listBoxOfficeFixedEvents: jest.fn(),
          createAdminCash: jest.fn(),
          createAdminCheckoutSession: jest.fn(),
        },
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
