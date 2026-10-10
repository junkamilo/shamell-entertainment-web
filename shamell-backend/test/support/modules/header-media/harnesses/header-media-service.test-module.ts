import { Test, type TestingModule } from '@nestjs/testing';
import { createGalleryServiceMock } from '@test-support/modules/gallery/mocks/gallery.service.mock';
import { GalleryService } from '@app/modules/gallery/services/gallery.service';
import { createHeaderMediaRepositoryMock } from '@test-support/modules/header-media/mocks/header-media.repository.mock';
import { HeaderMediaRepository } from '@app/modules/header-media/services/header-media.repository';
import { HeaderMediaService } from '@app/modules/header-media/services/header-media.service';

export type HeaderMediaServiceTestHarness = {
  moduleRef: TestingModule;
  service: HeaderMediaService;
  repository: ReturnType<typeof createHeaderMediaRepositoryMock>;
  gallery: ReturnType<typeof createGalleryServiceMock>;
};

export async function createHeaderMediaServiceTestModule(): Promise<HeaderMediaServiceTestHarness> {
  const repository = createHeaderMediaRepositoryMock();
  const gallery = createGalleryServiceMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      HeaderMediaService,
      { provide: HeaderMediaRepository, useValue: repository },
      { provide: GalleryService, useValue: gallery },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(HeaderMediaService),
    repository,
    gallery,
  };
}
