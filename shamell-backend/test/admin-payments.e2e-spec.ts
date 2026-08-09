import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminPaymentsController } from '../src/modules/admin-payments/controllers/admin-payments.controller';
import { AdminPaymentsService } from '../src/modules/admin-payments/services/admin-payments.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('AdminPayments (e2e smoke)', () => {
  let app: INestApplication<App>;
  const adminPaymentsService = {
    listPayments: jest.fn(),
    getPaymentDetail: jest.fn(),
    countBadgeSince: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/payments is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        { provide: AdminPaymentsService, useValue: adminPaymentsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/admin/payments')
      .expect(403);
  });

  it('GET /api/v1/admin/payments returns list when guard allows', async () => {
    jest.clearAllMocks();
    adminPaymentsService.listPayments.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        { provide: AdminPaymentsService, useValue: adminPaymentsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/admin/payments')
      .expect(200)
      .expect((res) => {
        const body = res.body as { items: unknown[] };
        expect(body.items).toEqual([]);
      });
  });
});
