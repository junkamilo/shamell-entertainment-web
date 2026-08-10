import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { HeaderTextController } from '../src/modules/header-media/controllers/header-text.controller';
import { createHeaderMediaServiceMock } from '../src/modules/header-media/__mocks__/header-media.service.mock';
import { createHeaderTextServiceMock } from '../src/modules/header-media/__mocks__/header-text.service.mock';
import { createHeaderMediaHttpApp } from '../src/modules/header-media/testing/header-media-http-app';
import type {
  ErrorBody,
  HeaderPhotoBody,
  HeaderPhotoDeleteBody,
  HeaderPhotoListBody,
  HeaderPhotoMutationBody,
} from '../src/modules/header-media/testing/header-media.test-types';
import { HeaderTextService } from '../src/modules/header-media/services/header-text.service';

const PHOTO_ID = '22222222-2222-4222-8222-222222222222';

const samplePhoto: HeaderPhotoBody = {
  id: PHOTO_ID,
  imageUrl: 'https://cdn.example/hero.jpg',
  imageUrlMobile: 'https://cdn.example/hero-m.jpg',
  videoDeliveryUrl: null,
  videoPosterUrl: null,
  videoPosterUrlMobile: null,
  imagePublicId: 'shamell/gallery/hero',
  mediaType: 'IMAGE',
  focalX: 50,
  focalY: 35,
  focalMobileX: 50,
  focalMobileY: 35,
  isActive: true,
};

describe('HeaderMedia (contract e2e)', () => {
  let app: INestApplication<App>;
  const headerMediaService = createHeaderMediaServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createHeaderMediaHttpApp({
        guardsAllow: false,
        headerMediaService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/header-media/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST /admin/photos returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/header-media/admin/photos')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/photos/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .send({ isActive: false })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/photos/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createHeaderMediaHttpApp({
        guardsAllow: true,
        headerMediaService,
      });
      app = created.app;
    });

    it('GET / returns typed public photos', async () => {
      headerMediaService.getPublicHeaderPhotos.mockResolvedValue([samplePhoto]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/header-media')
        .expect(200);

      const body = res.body as HeaderPhotoListBody;
      expect(body).toHaveLength(1);
      expect(body[0]?.id).toBe(PHOTO_ID);
      expect(headerMediaService.getPublicHeaderPhotos).toHaveBeenCalled();
    });

    it('GET /admin returns typed admin photos', async () => {
      headerMediaService.getAdminHeaderPhotos.mockResolvedValue([samplePhoto]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/header-media/admin')
        .expect(200);

      const body = res.body as HeaderPhotoListBody;
      expect(body[0]?.mediaType).toBe('IMAGE');
      expect(headerMediaService.getAdminHeaderPhotos).toHaveBeenCalled();
    });

    it('PATCH /admin/photos/:id returns typed toggle stub', async () => {
      headerMediaService.toggleAdminHeaderPhoto.mockResolvedValue({
        message: 'Header photo updated successfully.',
        item: { ...samplePhoto, isActive: false },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .send({ isActive: false })
        .expect(200);

      const body = res.body as HeaderPhotoMutationBody;
      expect(body.message).toContain('updated');
      expect(body.item?.isActive).toBe(false);
      expect(headerMediaService.toggleAdminHeaderPhoto).toHaveBeenCalledWith(
        PHOTO_ID,
        false,
      );
    });

    it('PATCH /admin/photos/:id/focal returns typed focal stub', async () => {
      headerMediaService.updateAdminHeaderPhotoFocalPoint.mockResolvedValue({
        message: 'Header photo focus updated successfully.',
        item: { ...samplePhoto, focalX: 10, focalY: 20 },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}/focal`)
        .send({
          focalX: 10,
          focalY: 20,
          focalMobileX: 30,
          focalMobileY: 40,
        })
        .expect(200);

      const body = res.body as HeaderPhotoMutationBody;
      expect(body.item?.focalX).toBe(10);
      expect(
        headerMediaService.updateAdminHeaderPhotoFocalPoint,
      ).toHaveBeenCalledWith(PHOTO_ID, 10, 20, 30, 40);
    });

    it('DELETE /admin/photos/:id returns typed delete stub', async () => {
      headerMediaService.deleteAdminHeaderPhoto.mockResolvedValue({
        message: 'Header photo deleted successfully.',
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .expect(200);

      const body = res.body as HeaderPhotoDeleteBody;
      expect(body.message).toContain('deleted');
      expect(headerMediaService.deleteAdminHeaderPhoto).toHaveBeenCalledWith(
        PHOTO_ID,
      );
    });

    it('PATCH /admin/photos/:id missing isActive BadRequest includes x-request-id', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .send({})
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
      expect(headerMediaService.toggleAdminHeaderPhoto).not.toHaveBeenCalled();
    });

    it('DELETE /admin/photos/:id NotFound includes x-request-id', async () => {
      headerMediaService.deleteAdminHeaderPhoto.mockRejectedValue(
        new NotFoundException('Header photo not found.'),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('PATCH /admin/photos/:id BadRequest from service includes x-request-id', async () => {
      headerMediaService.toggleAdminHeaderPhoto.mockRejectedValue(
        new BadRequestException('Invalid toggle.'),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
        .send({ isActive: true })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });
  });
});

describe('HeaderText (e2e smoke)', () => {
  let app: INestApplication<App>;
  const headerTextService = createHeaderTextServiceMock();

  afterEach(async () => {
    await app.close();
  });

  async function createTextApp(canActivate: boolean) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HeaderTextController],
      providers: [{ provide: HeaderTextService, useValue: headerTextService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => canActivate })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  }

  it('GET /api/v1/header-text/admin is forbidden without auth', async () => {
    await createTextApp(false);
    await request(app.getHttpServer())
      .get('/api/v1/header-text/admin')
      .expect(403);
  });

  it('GET /api/v1/header-text returns public text', async () => {
    jest.clearAllMocks();
    headerTextService.getPublicHeaderText.mockResolvedValue({
      headline: 'SHAMELL',
      isActive: true,
    });
    await createTextApp(true);

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
