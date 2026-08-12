import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminStripeWebhooksController } from '../src/modules/admin-stripe-webhooks/controllers/admin-stripe-webhooks.controller';
import { AdminStripeWebhooksService } from '../src/modules/admin-stripe-webhooks/services/admin-stripe-webhooks.service';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Stripe webhook security checklist — AdminStripeWebhooks (e2e)', () => {
  let app: INestApplication<App>;
  const adminStripeWebhooksService = {
    listEvents: jest.fn(),
    getEventByStripeId: jest.fn(),
  };
  const jwtService = {
    verifyAsync: jest.fn(),
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  async function createAppWithRealGuard() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminStripeWebhooksController],
      providers: [
        {
          provide: AdminStripeWebhooksService,
          useValue: adminStripeWebhooksService,
        },
        AdminJwtGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  }

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('GET list without Authorization returns 401', async () => {
    await createAppWithRealGuard();

    await request(app.getHttpServer())
      .get('/api/v1/admin/stripe-webhook-events')
      .expect(401);
    expect(adminStripeWebhooksService.listEvents).not.toHaveBeenCalled();
  });

  it('GET detail without Authorization returns 401', async () => {
    await createAppWithRealGuard();

    await request(app.getHttpServer())
      .get('/api/v1/admin/stripe-webhook-events/evt_test')
      .expect(401);
    expect(
      adminStripeWebhooksService.getEventByStripeId,
    ).not.toHaveBeenCalled();
  });

  it('GET list returns 200 when guard allows', async () => {
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
