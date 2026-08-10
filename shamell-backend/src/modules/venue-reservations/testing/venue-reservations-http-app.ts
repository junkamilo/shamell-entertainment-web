import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../../../common/http/apply-http-observability';
import { StripeWebhookController } from '../controllers/stripe-webhook.controller';
import { VenueReservationsController } from '../controllers/venue-reservations.controller';
import { StripeWebhookDispatchService } from '../services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../services/venue-reservations.service';

export type VenueReservationsHttpAppOptions = {
  guardsAllow: boolean;
  venueReservationsService: Partial<VenueReservationsService> | object;
  stripeWebhookDispatch?: Partial<StripeWebhookDispatchService> | object;
  includeWebhookController?: boolean;
};

export async function createVenueReservationsHttpApp(
  options: VenueReservationsHttpAppOptions,
): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const controllers = options.includeWebhookController
    ? [VenueReservationsController, StripeWebhookController]
    : [VenueReservationsController];

  const moduleRef = await Test.createTestingModule({
    controllers,
    providers: [
      {
        provide: VenueReservationsService,
        useValue: options.venueReservationsService,
      },
      {
        provide: StripeWebhookDispatchService,
        useValue: options.stripeWebhookDispatch ?? {
          handle: jest.fn(),
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

  const app = moduleRef.createNestApplication(
    options.includeWebhookController ? { rawBody: true } : undefined,
  ) as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();
  return { app, moduleRef };
}
