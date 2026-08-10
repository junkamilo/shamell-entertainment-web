import { Test, type TestingModule } from '@nestjs/testing';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { GalleryService } from '../../gallery/services/gallery.service';
import { createHeaderMediaRepositoryMock } from '../__mocks__/header-media.repository.mock';
import { HeaderMediaRepository } from '../services/header-media.repository';
import { HeaderMediaService } from '../services/header-media.service';

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
