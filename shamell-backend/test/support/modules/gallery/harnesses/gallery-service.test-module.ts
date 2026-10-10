import { Test, type TestingModule } from '@nestjs/testing';
import { createGalleryMediaServiceMock } from '@test-support/modules/gallery/mocks/gallery-media.service.mock';
import { createGalleryRepositoryMock } from '@test-support/modules/gallery/mocks/gallery.repository.mock';
import { GalleryMediaService } from '@app/modules/gallery/services/gallery-media.service';
import { GalleryRepository } from '@app/modules/gallery/services/gallery.repository';
import { GalleryService } from '@app/modules/gallery/services/gallery.service';

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
