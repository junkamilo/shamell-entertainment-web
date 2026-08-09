import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeAboutContentRow } from '../__mocks__/about.fixtures';
import { AboutRepository } from './about.repository';

describe('AboutRepository', () => {
  let repository: AboutRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AboutRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AboutRepository);
  });

  it('findLatest returns null when empty', async () => {
    prisma.aboutContent.findFirst.mockResolvedValue(null);
    await expect(repository.findLatest()).resolves.toBeNull();
    expect(prisma.aboutContent.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('findLatest returns the newest row', async () => {
    const row = makeAboutContentRow();
    prisma.aboutContent.findFirst.mockResolvedValue(row);
    await expect(repository.findLatest()).resolves.toEqual(row);
  });

  it('create delegates to prisma', async () => {
    const row = makeAboutContentRow();
    prisma.aboutContent.create.mockResolvedValue(row);
    const data = {
      title: row.title,
      paragraph1: row.paragraph1,
      coreValues: row.coreValues,
      imageUrl: row.imageUrl,
      imagePublicId: row.imagePublicId ?? null,
      heroMediaType: 'IMAGE' as const,
      videoDeliveryUrl: null,
      videoPosterUrl: null,
      isActive: true,
    };
    await expect(repository.create(data)).resolves.toEqual(row);
    expect(prisma.aboutContent.create).toHaveBeenCalledWith({ data });
  });

  it('update delegates to prisma', async () => {
    const row = makeAboutContentRow({ title: 'Updated' });
    prisma.aboutContent.update.mockResolvedValue(row);
    await expect(
      repository.update('about-row-1', { title: 'Updated' }),
    ).resolves.toEqual(row);
    expect(prisma.aboutContent.update).toHaveBeenCalledWith({
      where: { id: 'about-row-1' },
      data: { title: 'Updated' },
    });
  });

  it('clearHeroMedia nulls media fields', async () => {
    const cleared = makeAboutContentRow({
      imageUrl: null,
      imagePublicId: null,
      heroMediaType: 'IMAGE',
    });
    prisma.aboutContent.update.mockResolvedValue(cleared);
    await expect(repository.clearHeroMedia('about-row-1')).resolves.toEqual(
      cleared,
    );
    expect(prisma.aboutContent.update).toHaveBeenCalledWith({
      where: { id: 'about-row-1' },
      data: {
        imageUrl: null,
        imagePublicId: null,
        heroMediaType: 'IMAGE',
        videoDeliveryUrl: null,
        videoPosterUrl: null,
      },
    });
  });
});
