import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import {
  makeHeaderPhoto,
  makeMulterFile,
} from '../__mocks__/header-media.fixtures';
import { createHeaderMediaServiceMock } from '../__mocks__/header-media.service.mock';
import { HeaderMediaService } from '../services/header-media.service';
import { HeaderMediaController } from './header-media.controller';

describe('HeaderMediaController', () => {
  let controller: HeaderMediaController;
  const headerMediaService = createHeaderMediaServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HeaderMediaController],
      providers: [
        { provide: HeaderMediaService, useValue: headerMediaService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(HeaderMediaController);
  });

  it('getPublicHeaderPhotos delegates', async () => {
    headerMediaService.getPublicHeaderPhotos.mockResolvedValue([]);
    await expect(controller.getPublicHeaderPhotos()).resolves.toEqual([]);
  });

  it('uploadAdminHeaderPhotos requires files', () => {
    expect(() => controller.uploadAdminHeaderPhotos(undefined)).toThrow(
      BadRequestException,
    );
  });

  it('uploadAdminHeaderPhotos passes files', async () => {
    const files = [makeMulterFile()];
    headerMediaService.uploadAdminHeaderPhotos.mockResolvedValue({
      message: 'ok',
      items: [],
    });
    await controller.uploadAdminHeaderPhotos(files);
    expect(headerMediaService.uploadAdminHeaderPhotos).toHaveBeenCalledWith(
      files,
    );
  });

  it('toggleAdminHeaderPhoto requires boolean isActive', () => {
    expect(() => controller.toggleAdminHeaderPhoto('photo-1', {})).toThrow(
      BadRequestException,
    );
  });

  it('updateAdminHeaderPhotoFocalPoint validates range', () => {
    expect(() =>
      controller.updateAdminHeaderPhotoFocalPoint('photo-1', {
        focalX: 10,
        focalY: 10,
        focalMobileX: 10,
        focalMobileY: 200,
      }),
    ).toThrow(BadRequestException);
  });

  it('deleteAdminHeaderPhoto delegates', async () => {
    headerMediaService.deleteAdminHeaderPhoto.mockResolvedValue({
      message: 'ok',
    });
    await expect(controller.deleteAdminHeaderPhoto('photo-1')).resolves.toEqual(
      { message: 'ok' },
    );
  });

  it('getAdminHeaderPhotos delegates', async () => {
    const items = [makeHeaderPhoto()];
    headerMediaService.getAdminHeaderPhotos.mockResolvedValue(items);
    await expect(controller.getAdminHeaderPhotos()).resolves.toEqual(items);
  });
});
