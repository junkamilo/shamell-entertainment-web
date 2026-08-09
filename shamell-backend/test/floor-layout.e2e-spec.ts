import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { FloorLayoutController } from '../src/modules/floor-layout/controllers/floor-layout.controller';
import { FloorLayoutService } from '../src/modules/floor-layout/services/floor-layout.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('FloorLayout (e2e smoke)', () => {
  let app: INestApplication<App>;
  const floorLayoutService = {
    getPublicFloorLayout: jest.fn(),
    getAdminFloorLayout: jest.fn(),
    getAdminPalette: jest.fn(),
    upsertAdminFloorLayout: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/floor-layout/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FloorLayoutController],
      providers: [
        { provide: FloorLayoutService, useValue: floorLayoutService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/floor-layout/admin')
      .expect(403);
  });

  it('GET /api/v1/floor-layout returns public layout', async () => {
    jest.clearAllMocks();
    floorLayoutService.getPublicFloorLayout.mockResolvedValue({
      id: 'layout-e2e-1',
      items: [],
      isDefault: false,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FloorLayoutController],
      providers: [
        { provide: FloorLayoutService, useValue: floorLayoutService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/floor-layout')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          id: 'layout-e2e-1',
          items: [],
          isDefault: false,
        });
        expect(floorLayoutService.getPublicFloorLayout).toHaveBeenCalled();
      });
  });
});
