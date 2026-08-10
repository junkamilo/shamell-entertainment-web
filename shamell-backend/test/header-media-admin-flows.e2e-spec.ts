import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeHeaderCategory,
  makeHeaderPhoto,
} from '../src/modules/header-media/__mocks__/header-media.fixtures';
import { createHeaderMediaServiceMock } from '../src/modules/header-media/__mocks__/header-media.service.mock';
import { createHeaderMediaHttpApp } from '../src/modules/header-media/testing/header-media-http-app';
import { createHeaderMediaServiceTestModule } from '../src/modules/header-media/testing/header-media-service.test-module';
import type {
  ErrorBody,
  HeaderPhotoDeleteBody,
  HeaderPhotoListBody,
  HeaderPhotoMutationBody,
} from '../src/modules/header-media/testing/header-media.test-types';

const PHOTO_ID = '22222222-2222-4222-8222-222222222222';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createHeaderMediaServiceTestModule>
  >['repository'];
  gallery: Awaited<
    ReturnType<typeof createHeaderMediaServiceTestModule>
  >['gallery'];
};

async function createDeepHeaderMediaHttpApp(): Promise<DeepHarness> {
  const harness = await createHeaderMediaServiceTestModule();
  const headerMediaService = {
    ...createHeaderMediaServiceMock(),
    getPublicHeaderPhotos: () => harness.service.getPublicHeaderPhotos(),
    getAdminHeaderPhotos: () => harness.service.getAdminHeaderPhotos(),
    toggleAdminHeaderPhoto: (id: string, isActive: boolean) =>
      harness.service.toggleAdminHeaderPhoto(id, isActive),
    deleteAdminHeaderPhoto: (id: string) =>
      harness.service.deleteAdminHeaderPhoto(id),
    updateAdminHeaderPhotoFocalPoint: (
      id: string,
      focalX: number,
      focalY: number,
      focalMobileX: number,
      focalMobileY: number,
    ) =>
      harness.service.updateAdminHeaderPhotoFocalPoint(
        id,
        focalX,
        focalY,
        focalMobileX,
        focalMobileY,
      ),
  };

  const { app } = await createHeaderMediaHttpApp({
    guardsAllow: true,
    headerMediaService,
  });

  return {
    app,
    repository: harness.repository,
    gallery: harness.gallery,
  };
}

describe('HeaderMedia admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let gallery: DeepHarness['gallery'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepHeaderMediaHttpApp();
    app = created.app;
    repository = created.repository;
    gallery = created.gallery;
  }

  it('GET /admin lists photos via real HeaderMediaService', async () => {
    await boot();
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findAllPhotosByCategory.mockResolvedValue([
      makeHeaderPhoto({ id: PHOTO_ID }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/header-media/admin')
      .expect(200);

    const body = res.body as HeaderPhotoListBody;
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(PHOTO_ID);
    expect(repository.findAllPhotosByCategory).toHaveBeenCalledWith(
      'header-cat-1',
    );
  });

  it('PATCH /admin/photos/:id toggles via real HeaderMediaService', async () => {
    await boot();
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue({ id: PHOTO_ID });
    repository.updatePhotoActive.mockResolvedValue(
      makeHeaderPhoto({ id: PHOTO_ID, isActive: false }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
      .send({ isActive: false })
      .expect(200);

    const body = res.body as HeaderPhotoMutationBody;
    expect(body.message).toContain('updated');
    expect(body.item?.isActive).toBe(false);
    expect(repository.updatePhotoActive).toHaveBeenCalledWith(PHOTO_ID, false);
  });

  it('DELETE /admin/photos/:id outside category returns 404', async () => {
    await boot();
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
      .expect(404);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(404);
    expect(gallery.deletePhoto).not.toHaveBeenCalled();
  });

  it('DELETE /admin/photos/:id deletes via real HeaderMediaService when in category', async () => {
    await boot();
    repository.findHeaderCategoryBySlug.mockResolvedValue(makeHeaderCategory());
    repository.findPhotoInCategory.mockResolvedValue({ id: PHOTO_ID });
    gallery.deletePhoto.mockResolvedValue({
      message: 'Gallery media deleted successfully.',
    });

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/header-media/admin/photos/${PHOTO_ID}`)
      .expect(200);

    const body = res.body as HeaderPhotoDeleteBody;
    expect(body.message).toContain('deleted');
    expect(gallery.deletePhoto).toHaveBeenCalledWith(PHOTO_ID);
  });
});
