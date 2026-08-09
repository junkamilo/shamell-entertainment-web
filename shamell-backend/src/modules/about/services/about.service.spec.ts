import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  makeAboutContentRow,
  makeMulterFile,
  makeUpsertDto,
  makeVideoAboutContentRow,
} from '../__mocks__/about.fixtures';
import { createAboutMediaServiceMock } from '../__mocks__/about-media.service.mock';
import { createAboutRepositoryMock } from '../__mocks__/about.repository.mock';
import { AboutMediaService } from './about-media.service';
import { AboutRepository } from './about.repository';
import { AboutService } from './about.service';

describe('AboutService', () => {
  let service: AboutService;
  const repository = createAboutRepositoryMock();
  const media = createAboutMediaServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AboutService,
        { provide: AboutRepository, useValue: repository },
        { provide: AboutMediaService, useValue: media },
      ],
    }).compile();
    service = moduleRef.get(AboutService);
  });

  it('getPublicAboutContent throws when missing', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.getPublicAboutContent()).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getPublicAboutContent maps image delivery for IMAGE heroes', async () => {
    repository.findLatest.mockResolvedValue(makeAboutContentRow());
    const result = await service.getPublicAboutContent();
    expect(result.heroMediaType).toBe('IMAGE');
    expect(result.title).toBe('About Shamell');
    expect(result.videoDeliveryUrl).toBeNull();
  });

  it('getPublicAboutContentOrNull returns null when empty', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(service.getPublicAboutContentOrNull()).resolves.toBeNull();
  });

  it('upsert creates when no existing row', async () => {
    repository.findLatest.mockResolvedValue(null);
    media.uploadHeroMedia.mockResolvedValue({
      secureUrl: 'https://cdn.example/new.jpg',
      publicId: 'shamell/about/new',
      mediaType: 'IMAGE',
      videoDeliveryUrl: null,
      videoPosterUrl: null,
    });
    const created = makeAboutContentRow({
      imageUrl: 'https://cdn.example/new.jpg',
      imagePublicId: 'shamell/about/new',
    });
    repository.create.mockResolvedValue(created);

    const result = await service.upsertAdminAboutContent(
      makeUpsertDto(),
      makeMulterFile(),
    );
    expect(result.message).toContain('created');
    expect(repository.create).toHaveBeenCalled();
    expect(media.uploadHeroMedia).toHaveBeenCalled();
  });

  it('upsert rejects create without media', async () => {
    repository.findLatest.mockResolvedValue(null);
    await expect(
      service.upsertAdminAboutContent(makeUpsertDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('upsert updates existing row', async () => {
    const existing = makeAboutContentRow();
    repository.findLatest.mockResolvedValue(existing);
    const updated = makeAboutContentRow({ title: 'New Title' });
    repository.update.mockResolvedValue(updated);

    const result = await service.upsertAdminAboutContent(
      makeUpsertDto({ title: 'New Title' }),
    );
    expect(result.message).toContain('updated');
    expect(repository.update).toHaveBeenCalled();
  });

  it('deleteAdminAboutHeroMedia clears media via repository', async () => {
    const existing = makeAboutContentRow();
    repository.findLatest.mockResolvedValue(existing);
    repository.clearHeroMedia.mockResolvedValue(
      makeAboutContentRow({ imageUrl: null, imagePublicId: null }),
    );

    const result = await service.deleteAdminAboutHeroMedia();
    expect(media.deleteHeroFromCloudinary).toHaveBeenCalledWith(
      existing.imagePublicId,
      'IMAGE',
    );
    expect(repository.clearHeroMedia).toHaveBeenCalledWith(existing.id);
    expect(result.message).toContain('removed');
  });

  it('backfillVideoDeliveryUrls updates VIDEO heroes', async () => {
    repository.findLatest.mockResolvedValue(makeVideoAboutContentRow());
    const saved = makeVideoAboutContentRow({
      videoDeliveryUrl: 'https://cdn.example/stream.mp4',
      videoPosterUrl: 'https://cdn.example/poster.jpg',
    });
    repository.update.mockResolvedValue(saved);

    const result = await service.backfillVideoDeliveryUrls({ warmCdn: true });
    expect(result.updated).toBe(true);
    expect(media.warmAboutVideoCdn).toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalled();
  });

  it('backfillVideoDeliveryUrls skips non-video heroes', async () => {
    repository.findLatest.mockResolvedValue(makeAboutContentRow());
    const result = await service.backfillVideoDeliveryUrls();
    expect(result.updated).toBe(false);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
