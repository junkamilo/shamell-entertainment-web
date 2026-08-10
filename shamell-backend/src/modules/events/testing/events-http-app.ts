import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { App } from 'supertest/types';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../../../common/http/apply-http-observability';
import { GalleryService } from '../../gallery/services/gallery.service';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { EventsController } from '../controllers/events.controller';
import { EventsService } from '../services/events.service';

export type EventsHttpAppOptions = {
  guardsAllow: boolean;
  eventsService: Partial<EventsService> | object;
  galleryService?: Partial<GalleryService> | object;
};

export async function createEventsHttpApp(
  options: EventsHttpAppOptions,
): Promise<{
  app: INestApplication<App>;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    controllers: [EventsController],
    providers: [
      {
        provide: EventsService,
        useValue: options.eventsService,
      },
      {
        provide: GalleryService,
        useValue: options.galleryService ?? createGalleryServiceMock(),
      },
    ],
  })
    .overrideGuard(AdminJwtGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { adminUser?: { id: string; email: string } };
        };
      }) => {
        if (!options.guardsAllow) {
          return false;
        }
        const req = context.switchToHttp().getRequest();
        req.adminUser = {
          id: 'admin-e2e-test',
          email: 'admin-e2e@test.local',
        };
        return true;
      },
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();
  return { app, moduleRef };
}
