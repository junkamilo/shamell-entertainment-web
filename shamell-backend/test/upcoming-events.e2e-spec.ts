import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpcomingEventsController } from '../src/modules/upcoming-events/controllers/upcoming-events.controller';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import { AdminClassEnrollmentService } from '../src/modules/upcoming-events/services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../src/modules/upcoming-events/services/admin-fixed-event-enrollment.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('UpcomingEvents (e2e smoke)', () => {
  let app: INestApplication<App>;
  const upcomingEventsService = {
    getPublicBySlug: jest.fn(),
  };
  const adminClassEnrollment = {
    listAdminBookableClassEvents: jest.fn(),
  };
  const adminFixedEventEnrollment = {
    listBoxOfficeFixedEvents: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/upcoming-events/admin/bookable-class-events is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UpcomingEventsController],
      providers: [
        { provide: UpcomingEventsService, useValue: upcomingEventsService },
        {
          provide: AdminClassEnrollmentService,
          useValue: adminClassEnrollment,
        },
        {
          provide: AdminFixedEventEnrollmentService,
          useValue: adminFixedEventEnrollment,
        },
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
      .get('/api/v1/upcoming-events/admin/bookable-class-events')
      .expect(403);
  });

  it('GET /api/v1/upcoming-events/:slug returns payload', async () => {
    jest.clearAllMocks();
    upcomingEventsService.getPublicBySlug.mockResolvedValue({
      slug: 'salsa-night',
      name: 'Salsa Night',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UpcomingEventsController],
      providers: [
        { provide: UpcomingEventsService, useValue: upcomingEventsService },
        {
          provide: AdminClassEnrollmentService,
          useValue: adminClassEnrollment,
        },
        {
          provide: AdminFixedEventEnrollmentService,
          useValue: adminFixedEventEnrollment,
        },
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
      .get('/api/v1/upcoming-events/salsa-night')
      .expect(200)
      .expect((res) => {
        const body = res.body as { slug: string };
        expect(body.slug).toBe('salsa-night');
      });
  });
});
