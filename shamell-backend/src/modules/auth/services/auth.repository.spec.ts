import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { AuthRepository } from './auth.repository';

describe('AuthRepository', () => {
  let repository: AuthRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [AuthRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();
    repository = moduleRef.get(AuthRepository);
  });

  it('findUserByEmail uses unique email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
    await repository.findUserByEmail('a@example.com');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@example.com' },
    });
  });

  it('createSuperAdmin creates SUPER_ADMIN', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u1', role: 'SUPER_ADMIN' });
    await repository.createSuperAdmin({
      fullName: 'Ada',
      email: 'ada@example.com',
      password: 'hash',
    });
    const calls = prisma.user.create.mock.calls as Array<
      [{ data: { role: string; email: string } }]
    >;
    expect(calls[0][0].data.role).toBe('SUPER_ADMIN');
    expect(calls[0][0].data.email).toBe('ada@example.com');
  });

  it('consumeInviteAndCreateAdmin runs in a transaction', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u2' });
    prisma.adminInvite.updateMany.mockResolvedValue({ count: 1 });

    await repository.consumeInviteAndCreateAdmin({
      inviteId: 'invite-1',
      email: 'new@example.com',
      fullName: 'New',
      passwordHash: 'hash',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.create).toHaveBeenCalled();
    const calls = prisma.adminInvite.updateMany.mock.calls as Array<
      [{ where: { id: string; consumedAt: null }; data: { consumedAt: Date } }]
    >;
    expect(calls[0][0].where).toEqual({ id: 'invite-1', consumedAt: null });
    expect(calls[0][0].data.consumedAt).toBeInstanceOf(Date);
  });

  it('consumeInviteAndCreateAdmin throws when invite already used', async () => {
    prisma.user.create.mockResolvedValue({ id: 'u2' });
    prisma.adminInvite.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.consumeInviteAndCreateAdmin({
        inviteId: 'invite-1',
        email: 'new@example.com',
        fullName: 'New',
        passwordHash: 'hash',
      }),
    ).rejects.toThrow('INVITE_ALREADY_USED');
  });
});
