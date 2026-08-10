import { ConflictException, NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createGalleryServiceMock } from '../src/modules/gallery/__mocks__/gallery.service.mock';
import { createGalleryHttpApp } from '../src/modules/gallery/testing/gallery-http-app';
import type {
  CategoryBody,
  CategoryMutationBody,
  DeletePhotoBody,
  ErrorBody,
  PhotoListBody,
  PhotoMutationBody,
} from '../src/modules/gallery/testing/gallery.test-types';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const PHOTO_ID = '22222222-2222-4222-8222-222222222222';

describe('Gallery (contract e2e)', () => {
  let app: INestApplication<App>;
  const galleryService = createGalleryServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createGalleryHttpApp({
        guardsAllow: false,
        galleryService,
      });
      app = created.app;
    });

    it('GET /admin/categories returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/admin/categories')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST /admin/categories returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/gallery/admin/categories')
        .send({ name: 'Shows' })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/categories/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
        .send({ name: 'Updated' })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('GET /admin/photos returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/gallery/admin/photos')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/photos/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/gallery/admin/photos/${PHOTO_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createGalleryHttpApp({
        guardsAllow: true,
        galleryService,
      });
      app = created.app;
    });

    it('GET /categories returns typed public categories', async () => {
      galleryService.getPublicCategories.mockResolvedValue([
        {
          id: CATEGORY_ID,
          name: 'Shows',
          slug: 'shows',
          isActive: true,
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/categories')
        .expect(200);

      const body = res.body as CategoryBody[];
      expect(body).toHaveLength(1);
      expect(body[0]?.slug).toBe('shows');
      expect(galleryService.getPublicCategories).toHaveBeenCalled();
    });

    it('GET /photos returns typed paginated list', async () => {
      galleryService.getPublicPhotos.mockResolvedValue({
        items: [],
        pagination: { page: 1, limit: 6, total: 0, totalPages: 1 },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/photos')
        .expect(200);

      const body = res.body as PhotoListBody;
      expect(body.pagination.limit).toBe(6);
      expect(body.items).toEqual([]);
      expect(galleryService.getPublicPhotos).toHaveBeenCalled();
    });

    it('GET /admin/categories returns typed admin list', async () => {
      galleryService.getAdminCategories.mockResolvedValue([
        {
          id: CATEGORY_ID,
          name: 'Shows',
          slug: 'shows',
          isActive: true,
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/admin/categories')
        .expect(200);

      const body = res.body as CategoryBody[];
      expect(body[0]?.id).toBe(CATEGORY_ID);
    });

    it('POST /admin/categories returns typed create stub', async () => {
      galleryService.createCategory.mockResolvedValue({
        message: 'Gallery category created successfully.',
        category: {
          id: CATEGORY_ID,
          name: 'Shows',
          slug: 'shows',
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/gallery/admin/categories')
        .send({ name: 'Shows' })
        .expect(201);

      const body = res.body as CategoryMutationBody;
      expect(body.message).toContain('created');
      expect(body.category.id).toBe(CATEGORY_ID);
    });

    it('PATCH /admin/categories/:id returns typed update stub', async () => {
      galleryService.updateCategory.mockResolvedValue({
        message: 'Gallery category updated successfully.',
        category: {
          id: CATEGORY_ID,
          name: 'Updated',
          slug: 'updated',
          isActive: true,
        },
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
        .send({ name: 'Updated' })
        .expect(200);

      const body = res.body as CategoryMutationBody;
      expect(body.category.name).toBe('Updated');
    });

    it('GET /admin/photos returns typed admin photos', async () => {
      galleryService.getAdminPhotos.mockResolvedValue([
        {
          id: PHOTO_ID,
          categoryId: CATEGORY_ID,
          imageUrl: 'https://cdn.example/x.jpg',
          imagePublicId: 'shamell/gallery/x',
          mediaType: 'IMAGE',
          isActive: true,
        },
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/gallery/admin/photos')
        .expect(200);

      const body = res.body as PhotoMutationBody['items'];
      expect(body?.[0]?.id).toBe(PHOTO_ID);
    });

    it('DELETE /admin/photos/:id returns typed delete stub', async () => {
      galleryService.deletePhoto.mockResolvedValue({
        message: 'Gallery media deleted successfully.',
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/gallery/admin/photos/${PHOTO_ID}`)
        .expect(200);

      const body = res.body as DeletePhotoBody;
      expect(body.message).toContain('deleted');
    });

    it('POST /admin/categories Conflict includes x-request-id', async () => {
      galleryService.createCategory.mockRejectedValue(
        new ConflictException('Category name already exists.'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/gallery/admin/categories')
        .send({ name: 'Shows' })
        .expect(409);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(409);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('PATCH /admin/categories/:id NotFound includes x-request-id', async () => {
      galleryService.updateCategory.mockRejectedValue(
        new NotFoundException('Gallery category not found.'),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
        .send({ name: 'Missing' })
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('PATCH /admin/categories/:id empty body BadRequest includes x-request-id', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/gallery/admin/categories/${CATEGORY_ID}`)
        .send({})
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
      expect(galleryService.updateCategory).not.toHaveBeenCalled();
    });
  });
});
