import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminStripeWebhooksController } from '../src/modules/admin-stripe-webhooks/controllers/admin-stripe-webhooks.controller';
import { AdminStripeWebhooksService } from '../src/modules/admin-stripe-webhooks/services/admin-stripe-webhooks.service';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';

describe('AdminStripeWebhooks (e2e smoke)', () => {
  let app: INestApplication<App>;
  const adminStripeWebhooksService = {
    listEvents: jest.fn(),
    getEventByStripeId: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/stripe-webhook-events is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminStripeWebhooksController],
      providers: [
        {
          provide: AdminStripeWebhooksService,
          useValue: adminStripeWebhooksService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/admin/stripe-webhook-events')
      .expect(403);
  });

  it('GET /api/v1/admin/stripe-webhook-events returns list when guard allows', async () => {
    jest.clearAllMocks();
    adminStripeWebhooksService.listEvents.mockResolvedValue({
      items: [],
      meta: { page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminStripeWebhooksController],
      providers: [
        {
          provide: AdminStripeWebhooksService,
          useValue: adminStripeWebhooksService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/admin/stripe-webhook-events')
      .expect(200)
      .expect((res) => {
        const body = res.body as { items: unknown[] };
        expect(body.items).toEqual([]);
      });
  });
});
