import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { ServicesController } from '../src/modules/services/controllers/services.controller';
import { ServicesService } from '../src/modules/services/services/services.service';

describe('Services (e2e smoke)', () => {
  let app: INestApplication<App>;
  const servicesService = {
    createService: jest.fn(),
    getPublicServices: jest.fn(),
    getPublicCatalogById: jest.fn(),
    getPublicServiceByInquiryCode: jest.fn(),
    getAdminServices: jest.fn(),
    getAdminServiceById: jest.fn(),
    updateService: jest.fn(),
    deleteService: jest.fn(),
    createServiceType: jest.fn(),
    getPublicServiceTypes: jest.fn(),
    getAdminServiceTypes: jest.fn(),
    updateServiceType: jest.fn(),
    deleteServiceType: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/services/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/services/admin')
      .expect(403);
  });

  it('GET /api/v1/services returns public services', async () => {
    jest.clearAllMocks();
    servicesService.getPublicServices.mockResolvedValue([
      {
        id: 'svc-e2e-1',
        serviceTypeName: 'VIP Event',
        description: 'Demo',
      },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/services')
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{ serviceTypeName: string }>;
        expect(body).toHaveLength(1);
        expect(body[0].serviceTypeName).toBe('VIP Event');
        expect(servicesService.getPublicServices).toHaveBeenCalled();
      });
  });

  it('GET /api/v1/services/admin/:id returns admin service detail', async () => {
    jest.clearAllMocks();
    servicesService.getAdminServiceById.mockResolvedValue({
      id: 'svc-e2e-1',
      serviceTypeName: 'VIP Event',
      description: 'Demo',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/services/admin/11111111-1111-4111-8111-111111111111')
      .expect(200)
      .expect((res) => {
        const body = res.body as { id: string; serviceTypeName: string };
        expect(body.id).toBe('svc-e2e-1');
        expect(body.serviceTypeName).toBe('VIP Event');
        expect(servicesService.getAdminServiceById).toHaveBeenCalledWith(
          '11111111-1111-4111-8111-111111111111',
        );
      });
  });
});
