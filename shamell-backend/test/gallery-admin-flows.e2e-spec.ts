import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from '../src/modules/gallery/__mocks__/gallery.fixtures';
import { createGalleryServiceMock } from '../src/modules/gallery/__mocks__/gallery.service.mock';
import { createGalleryHttpApp } from '../src/modules/gallery/testing/gallery-http-app';
import { createGalleryServiceTestModule } from '../src/modules/gallery/testing/gallery-service.test-module';
import type {
  CategoryMutationBody,
  DeletePhotoBody,
  ErrorBody,
  PhotoListBody,
} from '../src/modules/gallery/testing/gallery.test-types';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const PHOTO_ID = '22222222-2222-4222-8222-222222222222';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createGalleryServiceTestModule>
  >['repository'];
  media: Awaited<ReturnType<typeof createGalleryServiceTestModule>>['media'];
};

async function createDeepGalleryHttpApp(): Promise<DeepHarness> {
  const harness = await createGalleryServiceTestModule();
  const galleryService = {
    ...createGalleryServiceMock(),
    getPublicCategories: () => harness.service.getPublicCategories(),
    getPublicPhotos: (params?: unknown) =>
      harness.service.getPublicPhotos(
        params as Parameters<typeof harness.service.getPublicPhotos>[0],
      ),
    getAdminCategories: () => harness.service.getAdminCategories(),
    createCategory: (dto: unknown) =>
      harness.service.createCategory(
        dto as Parameters<typeof harness.service.createCategory>[0],
      ),
    updateCategory: (id: string, dto: unknown) =>
      harness.service.updateCategory(
        id,
        dto as Parameters<typeof harness.service.updateCategory>[1],
      ),
    getAdminPhotos: () => harness.service.getAdminPhotos(),
    deletePhoto: (id: string) => harness.service.deletePhoto(id),
  };

  const { app } = await createGalleryHttpApp({
    guardsAllow: true,
    galleryService,
  });

  return {
    app,
    repository: harness.repository,
    media: harness.media,
  };
}

describe('Gallery admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let media: DeepHarness['media'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepGalleryHttpApp();
    app = created.app;
    repository = created.repository;
    media = created.media;
  }

  it('POST /admin/categories creates via real GalleryService (201)', async () => {
    await boot();
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.createCategory.mockResolvedValue(
      makeGalleryCategory({ id: CATEGORY_ID, name: 'Shows', slug: 'shows' }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/gallery/admin/categories')
      .send({ name: 'Shows' })
      .expect(201);

    const body = res.body as CategoryMutationBody;
    expect(body.message).toContain('created');
    expect(body.category.id).toBe(CATEGORY_ID);
    expect(repository.createCategory).toHaveBeenCalledWith({
      name: 'Shows',
      slug: 'shows',
    });
  });

  it('PATCH /admin/categories/:id updates via real GalleryService', async () => {
    await boot();
    repository.findCategoryById.mockResolvedValue(
      makeGalleryCategory({ id: CATEGORY_ID }),
    );
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.updateCategory.mockResolvedValue(
      makeGalleryCategory({
        id: CATEGORY_ID,
        name: 'Updated Shows',
        slug: 'updated-shows',
      }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
      .send({ name: 'Updated Shows' })
      .expect(200);

    const body = res.body as CategoryMutationBody;
    expect(body.category.name).toBe('Updated Shows');
    expect(repository.updateCategory).toHaveBeenCalled();
  });

  it('PATCH /admin/categories/:id missing category returns 404', async () => {
    await boot();
    repository.findCategoryById.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
      .send({ name: 'Ghost' })
      .expect(404);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(404);
    expect(repository.updateCategory).not.toHaveBeenCalled();
  });

  it('POST /admin/categories P2002 returns conflict via real GalleryService', async () => {
    await boot();
    repository.findCategorySlugConflict.mockResolvedValue(null);
    repository.createCategory.mockRejectedValue({ code: 'P2002' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/gallery/admin/categories')
      .send({ name: 'Shows' })
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(409);
  });

  it('GET /photos returns paginated list via real GalleryService', async () => {
    await boot();
    repository.findPublicPhotos.mockResolvedValue([
      makeGalleryPhoto({ id: PHOTO_ID }),
    ]);
    repository.countPublicPhotos.mockResolvedValue(1);

    const res = await request(app.getHttpServer())
      .get('/api/v1/gallery/photos')
      .expect(200);

    const body = res.body as PhotoListBody;
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.id).toBe(PHOTO_ID);
    expect(body.pagination.total).toBe(1);
  });

  it('DELETE /admin/photos/:id soft-fails CDN then deletes via real GalleryService', async () => {
    await boot();
    repository.findPhotoById.mockResolvedValue(
      makeGalleryPhoto({ id: PHOTO_ID }),
    );
    media.deleteMediaFromCloudinary.mockRejectedValue(
      new Error('cdn unavailable'),
    );
    repository.deletePhoto.mockResolvedValue(
      makeGalleryPhoto({ id: PHOTO_ID }),
    );

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/gallery/admin/photos/${PHOTO_ID}`)
      .expect(200);

    const body = res.body as DeletePhotoBody;
    expect(body.message).toContain('deleted');
    expect(repository.deletePhoto).toHaveBeenCalledWith(PHOTO_ID);
  });
});
