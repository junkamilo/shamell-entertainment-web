import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { GalleryController } from '../src/modules/gallery/controllers/gallery.controller';
import { GalleryService } from '../src/modules/gallery/services/gallery.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Gallery (e2e smoke)', () => {
  let app: INestApplication<App>;
  const galleryService = {
    getPublicCategories: jest.fn(),
    getPublicPhotos: jest.fn(),
    getAdminCategories: jest.fn(),
    createCategory: jest.fn(),
    updateCategory: jest.fn(),
    getAdminPhotos: jest.fn(),
    createPhoto: jest.fn(),
    updatePhoto: jest.fn(),
    deletePhoto: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/gallery/admin/categories is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [{ provide: GalleryService, useValue: galleryService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/gallery/admin/categories')
      .expect(403);
  });

  it('GET /api/v1/gallery/categories returns public categories', async () => {
    jest.clearAllMocks();
    galleryService.getPublicCategories.mockResolvedValue([
      {
        id: 'cat-e2e-1',
        name: 'Shows',
        slug: 'shows',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [{ provide: GalleryService, useValue: galleryService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/gallery/categories')
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{ slug: string }>;
        expect(body).toHaveLength(1);
        expect(body[0].slug).toBe('shows');
        expect(galleryService.getPublicCategories).toHaveBeenCalled();
      });
  });

  it('GET /api/v1/gallery/photos returns paginated photos', async () => {
    jest.clearAllMocks();
    galleryService.getPublicPhotos.mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 1 },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [{ provide: GalleryService, useValue: galleryService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/gallery/photos')
      .expect(200)
      .expect((res) => {
        const body = res.body as { pagination: { limit: number } };
        expect(body.pagination.limit).toBe(6);
        expect(galleryService.getPublicPhotos).toHaveBeenCalled();
      });
  });
});
