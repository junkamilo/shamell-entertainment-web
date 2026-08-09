import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeRegisteredUserView } from '../__mocks__/users.fixtures';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(UsersRepository);
  });

  it('findIdByEmail looks up by email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
    await expect(
      repository.findIdByEmail('test.user@example.com'),
    ).resolves.toEqual({ id: 'user-1' });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test.user@example.com' },
      select: { id: true },
    });
  });

  it('createRegisteredUser creates with registered select', async () => {
    const user = makeRegisteredUserView();
    prisma.user.create.mockResolvedValue(user);
    await expect(
      repository.createRegisteredUser({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        password: 'hashed',
      }),
    ).resolves.toEqual(user);
    const createCalls = prisma.user.create.mock.calls as Array<
      [{ data: { email: string; password: string } }]
    >;
    expect(createCalls[0][0].data.email).toBe(user.email);
    expect(createCalls[0][0].data.password).toBe('hashed');
  });
});
