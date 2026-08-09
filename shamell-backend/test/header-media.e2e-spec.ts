import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HeaderMediaController } from '../src/modules/header-media/controllers/header-media.controller';
import { HeaderTextController } from '../src/modules/header-media/controllers/header-text.controller';
import { HeaderMediaService } from '../src/modules/header-media/services/header-media.service';
import { HeaderTextService } from '../src/modules/header-media/services/header-text.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('HeaderMedia (e2e smoke)', () => {
  let app: INestApplication<App>;
  const headerMediaService = {
    getPublicHeaderPhotos: jest.fn(),
    getAdminHeaderPhotos: jest.fn(),
    uploadAdminHeaderPhotos: jest.fn(),
    toggleAdminHeaderPhoto: jest.fn(),
    updateAdminHeaderPhotoFocalPoint: jest.fn(),
    deleteAdminHeaderPhoto: jest.fn(),
  };
  const headerTextService = {
    getPublicHeaderText: jest.fn(),
    getAdminHeaderText: jest.fn(),
    upsertAdminHeaderText: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  async function createApp(canActivate: boolean) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HeaderMediaController, HeaderTextController],
      providers: [
        { provide: HeaderMediaService, useValue: headerMediaService },
        { provide: HeaderTextService, useValue: headerTextService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => canActivate })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  }

  it('GET /api/v1/header-media/admin is forbidden without auth', async () => {
    await createApp(false);
    await request(app.getHttpServer())
      .get('/api/v1/header-media/admin')
      .expect(403);
  });

  it('GET /api/v1/header-text/admin is forbidden without auth', async () => {
    await createApp(false);
    await request(app.getHttpServer())
      .get('/api/v1/header-text/admin')
      .expect(403);
  });

  it('GET /api/v1/header-media returns public photos', async () => {
    jest.clearAllMocks();
    headerMediaService.getPublicHeaderPhotos.mockResolvedValue([
      { id: 'photo-e2e-1', mediaType: 'IMAGE' },
    ]);
    await createApp(true);

    await request(app.getHttpServer())
      .get('/api/v1/header-media')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(headerMediaService.getPublicHeaderPhotos).toHaveBeenCalled();
      });
  });

  it('GET /api/v1/header-text returns public text', async () => {
    jest.clearAllMocks();
    headerTextService.getPublicHeaderText.mockResolvedValue({
      headline: 'SHAMELL',
      isActive: true,
    });
    await createApp(true);

    await request(app.getHttpServer())
      .get('/api/v1/header-text')
      .expect(200)
      .expect((res) => {
        const body = res.body as { headline: string };
        expect(body.headline).toBe('SHAMELL');
        expect(headerTextService.getPublicHeaderText).toHaveBeenCalled();
      });
  });
});
