import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  makeCreateUserDto,
  makeRegisteredUserView,
} from '@test-support/modules/users/fixtures/users.fixtures';
import { createUsersRepositoryMock } from '@test-support/modules/users/mocks/users.repository.mock';
import { UsersRepository } from '@app/modules/users/services/users.repository';
import { UsersService } from '@app/modules/users/services/users.service';

jest.mock('@app/modules/auth/utils/auth-crypto.util', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
}));

import { hashPassword } from '@app/modules/auth/utils/auth-crypto.util';

describe('UsersService', () => {
  let service: UsersService;
  const repository = createUsersRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    (hashPassword as jest.Mock).mockResolvedValue('hashed-password');
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it('register throws when email already exists', async () => {
    repository.findIdByEmail.mockResolvedValue({ id: 'existing' });
    await expect(service.register(makeCreateUserDto())).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.createRegisteredUser).not.toHaveBeenCalled();
  });

  it('register creates user on happy path', async () => {
    const user = makeRegisteredUserView({ email: 'new@example.com' });
    repository.findIdByEmail.mockResolvedValue(null);
    repository.createRegisteredUser.mockResolvedValue(user);

    await expect(
      service.register(
        makeCreateUserDto({
          email: 'New@Example.com',
          fullName: user.fullName,
        }),
      ),
    ).resolves.toEqual({
      message: 'User registered successfully',
      user,
    });

    expect(hashPassword).toHaveBeenCalledWith('password123');
    expect(repository.findIdByEmail).toHaveBeenCalledWith('new@example.com');
    expect(repository.createRegisteredUser).toHaveBeenCalledWith({
      fullName: user.fullName,
      email: 'new@example.com',
      phone: '+15551234567',
      password: 'hashed-password',
    });
  });
});
