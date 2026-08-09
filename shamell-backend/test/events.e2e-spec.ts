import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { EventsController } from '../src/modules/events/controllers/events.controller';
import { EventsService } from '../src/modules/events/services/events.service';
import { GalleryService } from '../src/modules/gallery/services/gallery.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Events (e2e smoke)', () => {
  let app: INestApplication<App>;
  const eventsService = {
    getPublicEvents: jest.fn(),
    getContactLines: jest.fn(),
    getPublicEventTypes: jest.fn(),
    getPublicCatalogById: jest.fn(),
    getAdminEvents: jest.fn(),
    getAdminEventById: jest.fn(),
    getAdminEventTypes: jest.fn(),
    getAdminOccasionTypes: jest.fn(),
  };
  const galleryService = {
    createPhotosForEvent: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/events/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: eventsService },
        { provide: GalleryService, useValue: galleryService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/events/admin').expect(403);
  });

  it('GET /api/v1/events returns public catalog', async () => {
    jest.clearAllMocks();
    eventsService.getPublicEvents.mockResolvedValue([
      { id: 'evt-e2e-1', eventTypeName: 'Wedding' },
    ]);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: eventsService },
        { provide: GalleryService, useValue: galleryService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/events')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          { id: 'evt-e2e-1', eventTypeName: 'Wedding' },
        ]);
        expect(eventsService.getPublicEvents).toHaveBeenCalled();
      });
  });
});
