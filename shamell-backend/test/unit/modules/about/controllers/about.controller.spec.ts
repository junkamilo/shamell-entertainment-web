import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { createAboutServiceMock } from '@test-support/modules/about/mocks/about.service.mock';
import {
  makeAboutResponse,
  makeMulterFile,
  makeUpsertDto,
} from '@test-support/modules/about/fixtures/about.fixtures';
import { AboutService } from '@app/modules/about/services/about.service';
import { AboutController } from '@app/modules/about/controllers/about.controller';

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
      .overrideGuard(ThrottlerGuard)
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
