import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BookingsController } from '../src/modules/bookings/controllers/bookings.controller';
import { BookingsService } from '../src/modules/bookings/services/bookings.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Bookings (e2e smoke)', () => {
  let app: INestApplication<App>;
  const bookingsService = {
    getPublicOccupiedByDate: jest.fn(),
    findAllAdmin: jest.fn(),
    findOneAdmin: jest.fn(),
    resolveQuotePayUrl: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/bookings/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
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
      .get('/api/v1/bookings/admin')
      .expect(403);
  });

  it('GET /api/v1/bookings/public/occupied returns payload', async () => {
    jest.clearAllMocks();
    bookingsService.getPublicOccupiedByDate.mockResolvedValue({
      date: '2026-07-15',
      occupied: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
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
      .get('/api/v1/bookings/public/occupied')
      .query({ date: '2026-07-15' })
      .expect(200)
      .expect((res) => {
        const body = res.body as { date: string; occupied: unknown[] };
        expect(body.date).toBe('2026-07-15');
        expect(body.occupied).toEqual([]);
      });
  });
});
