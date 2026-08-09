import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';
import { ReservationEventTemplatesController } from '../src/modules/reservation-event-templates/controllers/reservation-event-templates.controller';
import { ReservationEventTemplatesService } from '../src/modules/reservation-event-templates/services/reservation-event-templates.service';

describe('ReservationEventTemplates (e2e smoke)', () => {
  let app: INestApplication<App>;
  const templatesService = {
    listAdmin: jest.fn(),
    getAdminById: jest.fn(),
    createAdmin: jest.fn(),
    updateAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
    findByIdOrThrow: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/reservation-event-templates/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReservationEventTemplatesController],
      providers: [
        {
          provide: ReservationEventTemplatesService,
          useValue: templatesService,
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
      .get('/api/v1/reservation-event-templates/admin')
      .expect(403);
  });

  it('GET /api/v1/reservation-event-templates/admin returns list when authorized', async () => {
    jest.clearAllMocks();
    templatesService.listAdmin.mockResolvedValue([
      {
        id: 'tmpl-e2e-1',
        name: 'E2E Template',
        scheduleMode: 'FIXED_EVENT',
      },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReservationEventTemplatesController],
      providers: [
        {
          provide: ReservationEventTemplatesService,
          useValue: templatesService,
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
      .get('/api/v1/reservation-event-templates/admin')
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{ name: string }>;
        expect(body).toHaveLength(1);
        expect(body[0].name).toBe('E2E Template');
        expect(templatesService.listAdmin).toHaveBeenCalled();
      });
  });
});
