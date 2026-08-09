import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { VenueReservationsController } from '../src/modules/venue-reservations/controllers/venue-reservations.controller';
import { StripeWebhookController } from '../src/modules/venue-reservations/controllers/stripe-webhook.controller';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';
import { StripeWebhookDispatchService } from '../src/modules/venue-reservations/services/stripe-webhook-dispatch.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('VenueReservations (e2e smoke)', () => {
  let app: INestApplication<App>;
  const venueReservationsService = {
    getAvailability: jest.fn(),
    listAdminReservations: jest.fn(),
  };
  const dispatch = {
    handle: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/venue-reservations/availability returns payload', async () => {
    jest.clearAllMocks();
    venueReservationsService.getAvailability.mockResolvedValue({
      reservedLayoutItemIds: [],
      reservationsOpen: false,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueReservationsController, StripeWebhookController],
      providers: [
        {
          provide: VenueReservationsService,
          useValue: venueReservationsService,
        },
        { provide: StripeWebhookDispatchService, useValue: dispatch },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/venue-reservations/availability')
      .expect(200)
      .expect((res) => {
        const body = res.body as { reservationsOpen: boolean };
        expect(body.reservationsOpen).toBe(false);
      });
  });

  it('GET /api/v1/venue-reservations/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueReservationsController, StripeWebhookController],
      providers: [
        {
          provide: VenueReservationsService,
          useValue: venueReservationsService,
        },
        { provide: StripeWebhookDispatchService, useValue: dispatch },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/venue-reservations/admin')
      .expect(403);
  });

  it('POST /api/v1/stripe/webhook returns 400 without signature', async () => {
    jest.clearAllMocks();
    dispatch.handle.mockImplementation(() => {
      throw new BadRequestException('Missing stripe-signature header.');
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueReservationsController, StripeWebhookController],
      providers: [
        {
          provide: VenueReservationsService,
          useValue: venueReservationsService,
        },
        { provide: StripeWebhookDispatchService, useValue: dispatch },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    // rawBody is required by controller; without it Nest throws before dispatch
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .send({})
      .expect(400);
  });
});
