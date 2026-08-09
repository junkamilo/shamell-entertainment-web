import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DEFAULT_HEADER_TEXT } from '../constants/header-media.constants';
import { makeHeroHeaderContent } from '../__mocks__/header-media.fixtures';
import { createHeaderTextRepositoryMock } from '../__mocks__/header-text.repository.mock';
import { HeaderTextRepository } from './header-text.repository';
import { HeaderTextService } from './header-text.service';

describe('HeaderTextService', () => {
  let service: HeaderTextService;
  const repository = createHeaderTextRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        HeaderTextService,
        { provide: HeaderTextRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(HeaderTextService);
  });

  it('getPublicHeaderText returns defaults when empty', async () => {
    repository.findLatestActive.mockResolvedValue(null);
    await expect(service.getPublicHeaderText()).resolves.toMatchObject({
      headline: DEFAULT_HEADER_TEXT.headline,
      updatedAt: null,
    });
  });

  it('getAdminHeaderText returns null when empty', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.getAdminHeaderText()).resolves.toBeNull();
  });

  it('upsertAdminHeaderText rejects empty dto', async () => {
    await expect(service.upsertAdminHeaderText({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('upsertAdminHeaderText creates when none exists', async () => {
    repository.findLatest.mockResolvedValue(null);
    repository.create.mockResolvedValue(
      makeHeroHeaderContent({ headline: 'New' }),
    );
    const result = await service.upsertAdminHeaderText({ headline: 'New' });
    expect(repository.create).toHaveBeenCalled();
    expect(result.headline).toBe('New');
  });

  it('upsertAdminHeaderText updates existing', async () => {
    const existing = makeHeroHeaderContent();
    repository.findLatest.mockResolvedValue(existing);
    repository.update.mockResolvedValue(
      makeHeroHeaderContent({ headline: 'Updated' }),
    );
    const result = await service.upsertAdminHeaderText({
      headline: 'Updated',
    });
    expect(repository.update).toHaveBeenCalledWith(existing.id, {
      isActive: true,
      headline: 'Updated',
    });
    expect(result.headline).toBe('Updated');
  });
});
