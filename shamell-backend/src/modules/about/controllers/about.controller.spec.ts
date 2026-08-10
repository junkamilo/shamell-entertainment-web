import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { createAboutServiceMock } from '../__mocks__/about.service.mock';
import {
  makeAboutResponse,
  makeMulterFile,
  makeUpsertDto,
} from '../__mocks__/about.fixtures';
import { AboutService } from '../services/about.service';
import { AboutController } from './about.controller';

describe('AboutController', () => {
  let controller: AboutController;
  const aboutService = createAboutServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AboutController],
      providers: [{ provide: AboutService, useValue: aboutService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AboutController);
  });

  it('getPublicAboutContent delegates to service', async () => {
    const payload = makeAboutResponse();
    aboutService.getPublicAboutContent.mockResolvedValue(payload);
    await expect(controller.getPublicAboutContent()).resolves.toEqual(payload);
  });

  it('getAdminAboutContent delegates to service', async () => {
    aboutService.getAdminAboutContent.mockResolvedValue(makeAboutResponse());
    await expect(controller.getAdminAboutContent()).resolves.toMatchObject({
      title: 'About Shamell',
    });
  });

  it('upsertAdminAboutContent rejects empty body without media', () => {
    expect(() => controller.upsertAdminAboutContent({})).toThrow(
      BadRequestException,
    );
  });

  it('upsertAdminAboutContent passes dto and file', async () => {
    const dto = makeUpsertDto();
    const file = makeMulterFile();
    aboutService.upsertAdminAboutContent.mockResolvedValue({
      message: 'ok',
      about: makeAboutResponse(),
    });
    await controller.upsertAdminAboutContent(dto, file);
    expect(aboutService.upsertAdminAboutContent).toHaveBeenCalledWith(
      dto,
      file,
    );
  });

  it('deleteAdminAboutHeroMedia delegates', async () => {
    aboutService.deleteAdminAboutHeroMedia.mockResolvedValue({
      message: 'removed',
      about: makeAboutResponse(),
    });
    await controller.deleteAdminAboutHeroMedia();
    expect(aboutService.deleteAdminAboutHeroMedia).toHaveBeenCalled();
  });

  it('backfillVideoDelivery parses warm query', async () => {
    aboutService.backfillVideoDeliveryUrls.mockResolvedValue({
      updated: true,
    });
    await controller.backfillVideoDelivery('1');
    expect(aboutService.backfillVideoDeliveryUrls).toHaveBeenCalledWith({
      warmCdn: true,
    });
  });
});
