import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AvailabilityController } from '../src/modules/availability/controllers/availability.controller';
import { AvailabilityService } from '../src/modules/availability/services/availability.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Availability (e2e smoke)', () => {
  let app: INestApplication<App>;
  const availabilityService = {
    getPublicRules: jest.fn(),
    getAdminSnapshot: jest.fn(),
    putWeeklySlots: jest.fn(),
    createClosure: jest.fn(),
    removeClosure: jest.fn(),
    bookingTimeZone: jest.fn(),
    assertDateTimeAllowed: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/availability/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: availabilityService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/availability/admin')
      .expect(403);
  });

  it('GET /api/v1/availability/public returns rules', async () => {
    jest.clearAllMocks();
    availabilityService.getPublicRules.mockResolvedValue({
      timeZone: 'America/New_York',
      weekly: [],
      closures: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: availabilityService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/availability/public')
      .expect(200)
      .expect((res) => {
        const body = res.body as { timeZone: string; weekly: unknown[] };
        expect(body.timeZone).toBe('America/New_York');
        expect(body.weekly).toEqual([]);
      });
  });
});
