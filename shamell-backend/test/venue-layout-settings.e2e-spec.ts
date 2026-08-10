import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { VenueLayoutSettingsController } from '../src/modules/venue-layout-settings/controllers/venue-layout-settings.controller';
import { VenueLayoutSettingsService } from '../src/modules/venue-layout-settings/services/venue-layout-settings.service';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';

describe('VenueLayoutSettings (e2e smoke)', () => {
  let app: INestApplication<App>;
  const settingsService = {
    getPublicSettings: jest.fn(),
    getAdminSettings: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/on-coming-events/settings returns payload', async () => {
    settingsService.getPublicSettings.mockResolvedValue({
      clientEnabled: true,
      promoTitle: 'On Coming',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueLayoutSettingsController],
      providers: [
        { provide: VenueLayoutSettingsService, useValue: settingsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/on-coming-events/settings')
      .expect(200)
      .expect((res) => {
        const body = res.body as { clientEnabled: boolean };
        expect(body.clientEnabled).toBe(true);
      });
  });

  it('GET /api/v1/venue-layout/settings alias works', async () => {
    settingsService.getPublicSettings.mockResolvedValue({
      clientEnabled: false,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueLayoutSettingsController],
      providers: [
        { provide: VenueLayoutSettingsService, useValue: settingsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/venue-layout/settings')
      .expect(200)
      .expect((res) => {
        const body = res.body as { clientEnabled: boolean };
        expect(body.clientEnabled).toBe(false);
      });
  });

  it('GET /api/v1/on-coming-events/settings/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VenueLayoutSettingsController],
      providers: [
        { provide: VenueLayoutSettingsService, useValue: settingsService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/on-coming-events/settings/admin')
      .expect(403);
  });
});
