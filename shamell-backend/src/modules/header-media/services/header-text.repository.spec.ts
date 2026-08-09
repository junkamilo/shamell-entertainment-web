import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeHeroHeaderContent } from '../__mocks__/header-media.fixtures';
import { HeaderTextRepository } from './header-text.repository';

describe('HeaderTextRepository', () => {
  let repository: HeaderTextRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        HeaderTextRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(HeaderTextRepository);
  });

  it('findLatestActive filters isActive', async () => {
    const row = makeHeroHeaderContent();
    prisma.heroHeaderContent.findFirst.mockResolvedValue(row);
    await expect(repository.findLatestActive()).resolves.toEqual(row);
    expect(prisma.heroHeaderContent.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('findLatest orders by updatedAt', async () => {
    const row = makeHeroHeaderContent();
    prisma.heroHeaderContent.findFirst.mockResolvedValue(row);
    await expect(repository.findLatest()).resolves.toEqual(row);
    expect(prisma.heroHeaderContent.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('create and update delegate', async () => {
    const row = makeHeroHeaderContent();
    prisma.heroHeaderContent.create.mockResolvedValue(row);
    prisma.heroHeaderContent.update.mockResolvedValue(row);
    await expect(
      repository.create({
        isActive: true,
        headline: 'H',
        headlineFont: 'brand',
        headlineColor: '#c5a55a',
        tagline: 'T',
        taglineFont: 'elegant',
        taglineColor: '#f5e6b8',
        quote: 'Q',
        quoteFont: 'script',
        quoteColor: '#c5a55a',
      }),
    ).resolves.toEqual(row);
    await expect(
      repository.update('hero-text-1', { headline: 'New' }),
    ).resolves.toEqual(row);
  });
});
