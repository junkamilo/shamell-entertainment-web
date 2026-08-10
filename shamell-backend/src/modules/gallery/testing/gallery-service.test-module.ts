import { Test, type TestingModule } from '@nestjs/testing';
import { createGalleryMediaServiceMock } from '../__mocks__/gallery-media.service.mock';
import { createGalleryRepositoryMock } from '../__mocks__/gallery.repository.mock';
import { GalleryMediaService } from '../services/gallery-media.service';
import { GalleryRepository } from '../services/gallery.repository';
import { GalleryService } from '../services/gallery.service';

export type GalleryServiceTestHarness = {
  moduleRef: TestingModule;
  service: GalleryService;
  repository: ReturnType<typeof createGalleryRepositoryMock>;
  media: ReturnType<typeof createGalleryMediaServiceMock>;
};

export async function createGalleryServiceTestModule(): Promise<GalleryServiceTestHarness> {
  const repository = createGalleryRepositoryMock();
  const media = createGalleryMediaServiceMock();

  repository.findCategoryById.mockResolvedValue({ id: 'cat-1' });

  const moduleRef = await Test.createTestingModule({
    providers: [
      GalleryService,
      { provide: GalleryRepository, useValue: repository },
      { provide: GalleryMediaService, useValue: media },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(GalleryService),
    repository,
    media,
  };
}
