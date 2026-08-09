import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';
import { VenueTablesController } from '../src/modules/venue-tables/controllers/venue-tables.controller';
import { VenueTablesService } from '../src/modules/venue-tables/services/venue-tables.service';

describe('VenueTables (e2e smoke)', () => {
  let app: INestApplication<App>;
  const venueTablesService = {
    getPublicVenueTables: jest.fn(),
    getAdminVenueTables: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/venue-tables/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueTablesController],
      providers: [
        { provide: VenueTablesService, useValue: venueTablesService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/venue-tables/admin')
      .expect(403);
  });

  it('GET /api/v1/venue-tables returns public catalog', async () => {
    jest.clearAllMocks();
    venueTablesService.getPublicVenueTables.mockResolvedValue([
      { id: 'table-1', size: 'LARGE', bundlePrice: 100 },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueTablesController],
      providers: [
        { provide: VenueTablesService, useValue: venueTablesService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/venue-tables')
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{ id: string }>;
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe('table-1');
      });
  });
});
