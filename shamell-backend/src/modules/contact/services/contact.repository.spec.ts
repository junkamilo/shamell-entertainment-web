import { Test } from '@nestjs/testing';
import { ContactRequestStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeContactRequestRow } from '../__mocks__/contact.fixtures';
import { ContactRepository } from './contact.repository';

describe('ContactRepository', () => {
  let repository: ContactRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(ContactRepository);
  });

  it('asPrisma returns injected prisma', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('create forwards data to contactRequest.create', async () => {
    const row = makeContactRequestRow();
    prisma.contactRequest.create.mockResolvedValue(row);
    await expect(
      repository.create({
        fullName: row.fullName,
        email: row.email,
        message: row.message,
        subject: row.subject,
        status: ContactRequestStatus.PENDING,
      }),
    ).resolves.toEqual(row);
    expect(prisma.contactRequest.create).toHaveBeenCalledWith({
      data: {
        fullName: row.fullName,
        email: row.email,
        message: row.message,
        subject: row.subject,
        status: ContactRequestStatus.PENDING,
      },
    });
  });

  it('findById / update / delete call prisma delegates', async () => {
    const row = makeContactRequestRow();
    prisma.contactRequest.findUnique.mockResolvedValue(row);
    prisma.contactRequest.update.mockResolvedValue(row);
    prisma.contactRequest.delete.mockResolvedValue(row);

    await expect(repository.findById('contact-1')).resolves.toEqual(row);
    await repository.update('contact-1', { isRead: true });
    await repository.delete('contact-1');

    expect(prisma.contactRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    });
    expect(prisma.contactRequest.update).toHaveBeenCalled();
    expect(prisma.contactRequest.delete).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    });
  });

  it('findOccasionTypeNamesByIds skips empty ids', async () => {
    await expect(repository.findOccasionTypeNamesByIds([])).resolves.toEqual(
      [],
    );
    expect(prisma.occasionType.findMany.mock.calls).toHaveLength(0);
  });

  it('inbox badge counts invoke $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 3n }]);
    await expect(repository.countPeticionesBadgeBookings(null)).resolves.toBe(
      3,
    );
    await expect(
      repository.countPeticionesBadgeGuidance(new Date(1)),
    ).resolves.toBe(3);
    await expect(
      repository.countPeticionesBadgePrivateClasses(null),
    ).resolves.toBe(3);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('runTransaction forwards to prisma.$transaction', async () => {
    prisma.$transaction.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) =>
        Promise.resolve(fn({ ok: true })),
    );
    const result = await repository.runTransaction((tx) => Promise.resolve(tx));
    expect(result).toEqual({ ok: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
