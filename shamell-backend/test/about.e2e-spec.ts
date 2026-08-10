import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AboutController } from '../src/modules/about/controllers/about.controller';
import { AboutService } from '../src/modules/about/services/about.service';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';

describe('About (e2e smoke)', () => {
  let app: INestApplication<App>;
  const aboutService = {
    getPublicAboutContent: jest.fn(),
    getAdminAboutContent: jest.fn(),
    upsertAdminAboutContent: jest.fn(),
    deleteAdminAboutHeroMedia: jest.fn(),
    backfillVideoDeliveryUrls: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AboutController],
      providers: [{ provide: AboutService, useValue: aboutService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/about returns public content', async () => {
    aboutService.getPublicAboutContent.mockResolvedValue({
      id: 'about-1',
      title: 'About',
      paragraph1: 'Hello',
      coreValues: ['Art'],
      imageUrl: null,
      heroMediaType: 'IMAGE',
      videoDeliveryUrl: null,
      videoPosterUrl: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await request(app.getHttpServer())
      .get('/api/v1/about')
      .expect(200)
      .expect((res) => {
        const body = res.body as { title: string };
        expect(body.title).toBe('About');
      });
  });

  it('GET /api/v1/about returns 404 when missing', async () => {
    aboutService.getPublicAboutContent.mockRejectedValue(
      new NotFoundException('About content not found.'),
    );

    // Nest default exception filter needs to be present; TestingModule app has it.
    await request(app.getHttpServer()).get('/api/v1/about').expect(404);
  });

  it('GET /api/v1/about/admin is forbidden without auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/about/admin').expect(403);
  });
});
