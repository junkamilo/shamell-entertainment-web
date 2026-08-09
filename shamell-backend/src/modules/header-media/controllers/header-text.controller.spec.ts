import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { DEFAULT_HEADER_TEXT } from '../constants/header-media.constants';
import { createHeaderTextServiceMock } from '../__mocks__/header-text.service.mock';
import { HeaderTextService } from '../services/header-text.service';
import { HeaderTextController } from './header-text.controller';

describe('HeaderTextController', () => {
  let controller: HeaderTextController;
  const headerTextService = createHeaderTextServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HeaderTextController],
      providers: [{ provide: HeaderTextService, useValue: headerTextService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(HeaderTextController);
  });

  it('getPublicHeaderText delegates', async () => {
    headerTextService.getPublicHeaderText.mockResolvedValue({
      ...DEFAULT_HEADER_TEXT,
      isActive: true,
      updatedAt: null,
    });
    await expect(controller.getPublicHeaderText()).resolves.toMatchObject({
      headline: DEFAULT_HEADER_TEXT.headline,
    });
  });

  it('getAdminHeaderText delegates', async () => {
    headerTextService.getAdminHeaderText.mockResolvedValue(null);
    await expect(controller.getAdminHeaderText()).resolves.toBeNull();
  });

  it('upsertAdminHeaderText rejects empty body', () => {
    expect(() => controller.upsertAdminHeaderText({})).toThrow(
      BadRequestException,
    );
  });

  it('upsertAdminHeaderText passes dto', async () => {
    headerTextService.upsertAdminHeaderText.mockResolvedValue({
      id: '1',
      ...DEFAULT_HEADER_TEXT,
      isActive: true,
      updatedAt: null,
    });
    await controller.upsertAdminHeaderText({ headline: 'X' });
    expect(headerTextService.upsertAdminHeaderText).toHaveBeenCalledWith({
      headline: 'X',
    });
  });
});
