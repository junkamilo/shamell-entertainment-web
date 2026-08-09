import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { createMailServiceMock } from '../../mail/__mocks__/mail.service.mock';
import { createAuthRepositoryMock } from '../__mocks__/auth.repository.mock';
import { createJwtServiceMock } from '../__mocks__/jwt.service.mock';
import {
  makeLoginDto,
  makeInviteDto,
  makeStaffUser,
} from '../__mocks__/auth.fixtures';
import * as cryptoUtil from '../utils/auth-crypto.util';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const repository = createAuthRepositoryMock();
  const jwt = createJwtServiceMock();
  const mail = createMailServiceMock();
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'BOOTSTRAP_ADMIN_SECRET') return 'secret';
      if (key === 'GOOGLE_CLIENT_ID') return undefined;
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      if (key === 'APP_PUBLIC_NAME') return 'Shamell Admin';
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repository },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
        { provide: MailService, useValue: mail },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('loginAdmin succeeds for valid staff credentials', async () => {
    const user = makeStaffUser({
      password: await cryptoUtil.hashPassword('password123'),
    });
    repository.findUserByEmail.mockResolvedValue(user);

    const result = await service.loginAdmin(makeLoginDto());
    expect(result.message).toBe('Login successful');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user.email).toBe('admin@example.com');
    expect(jwt.signAsync).toHaveBeenCalled();
  });

  it('loginAdmin rejects unknown email', async () => {
    repository.findUserByEmail.mockResolvedValue(null);
    await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('bootstrapAdmin rejects invalid secret', async () => {
    await expect(
      service.bootstrapAdmin(
        {
          fullName: 'Ada',
          email: 'ada@example.com',
          password: 'password123',
        },
        'wrong',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('inviteAdmin rejects inviter without permission', async () => {
    repository.findUserRoleById.mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
    });
    await expect(
      service.inviteAdmin('u1', makeInviteDto()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('forgotPassword returns generic message when user missing', async () => {
    repository.findUserIdByEmail.mockResolvedValue(null);
    await expect(
      service.forgotPassword({ email: 'missing@example.com' }),
    ).resolves.toEqual({
      message: 'If this email exists, a secure recovery link has been sent.',
    });
    expect(repository.setPasswordResetToken).not.toHaveBeenCalled();
  });

  it('resetPassword rejects invalid token', async () => {
    repository.findUserByValidResetToken.mockResolvedValue(null);
    await expect(
      service.resetPassword({
        token: 'bad',
        newPassword: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
