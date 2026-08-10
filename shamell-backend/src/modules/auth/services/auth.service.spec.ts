import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  makeAdminInviteRow,
  makeInviteDto,
  makeLoginDto,
  makeStaffUser,
} from '../__mocks__/auth.fixtures';
import { createAuthServiceTestModule } from '../testing/auth-service.test-module';
import * as cryptoUtil from '../utils/auth-crypto.util';
import type { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let repository: Awaited<
    ReturnType<typeof createAuthServiceTestModule>
  >['repository'];
  let jwt: Awaited<ReturnType<typeof createAuthServiceTestModule>>['jwt'];
  let mail: Awaited<ReturnType<typeof createAuthServiceTestModule>>['mail'];

  beforeEach(async () => {
    const harness = await createAuthServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    jwt = harness.jwt;
    mail = harness.mail;
  });

  describe('loginAdmin', () => {
    it('succeeds for valid staff credentials', async () => {
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

    it('rejects unknown email', async () => {
      repository.findUserByEmail.mockResolvedValue(null);
      await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects Google-only account without password', async () => {
      repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({ password: null }),
      );
      await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects bad password', async () => {
      repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({
          password: await cryptoUtil.hashPassword('other-pass'),
        }),
      );
      await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects non-staff role', async () => {
      repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({
          role: 'USER',
          password: await cryptoUtil.hashPassword('password123'),
        }),
      );
      await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rejects missing 2FA code when enabled', async () => {
      repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({
          password: await cryptoUtil.hashPassword('password123'),
          twoFactorEnabled: true,
          twoFactorSecret: '123456',
        }),
      );
      await expect(service.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('accepts valid 2FA code', async () => {
      repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({
          password: await cryptoUtil.hashPassword('password123'),
          twoFactorEnabled: true,
          twoFactorSecret: '123456',
        }),
      );
      const result = await service.loginAdmin(
        makeLoginDto({ twoFactorCode: '123456' }),
      );
      expect(result.accessToken).toBe('jwt-token');
    });
  });

  describe('bootstrapAdmin', () => {
    it('rejects invalid secret', async () => {
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

    it('rejects when bootstrap already completed', async () => {
      repository.findStaffAdminId.mockResolvedValue('existing-admin');
      await expect(
        service.bootstrapAdmin(
          {
            fullName: 'Ada',
            email: 'ada@example.com',
            password: 'password123',
          },
          'secret',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates SUPER_ADMIN when secret valid', async () => {
      repository.findStaffAdminId.mockResolvedValue(null);
      repository.findUserIdByEmail.mockResolvedValue(null);
      repository.createSuperAdmin.mockResolvedValue({
        id: 'new-admin',
        fullName: 'Ada',
        email: 'ada@example.com',
        role: 'SUPER_ADMIN',
      });
      const result = await service.bootstrapAdmin(
        {
          fullName: 'Ada',
          email: 'ada@example.com',
          password: 'password123',
        },
        'secret',
      );
      expect(result.message).toContain('created successfully');
      expect(repository.createSuperAdmin).toHaveBeenCalled();
    });
  });

  describe('inviteAdmin / verifyAdminInvite', () => {
    it('rejects inviter without permission', async () => {
      repository.findUserRoleById.mockResolvedValue({
        id: 'u1',
        role: 'ADMIN',
      });
      await expect(
        service.inviteAdmin('u1', makeInviteDto()),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects when mail not configured', async () => {
      mail.isConfigured.mockReturnValue(false);
      await expect(
        service.inviteAdmin('u1', makeInviteDto()),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sends invite for SUPER_ADMIN inviter', async () => {
      repository.findUserRoleById.mockResolvedValue({
        id: 'u1',
        role: 'SUPER_ADMIN',
      });
      repository.findUserIdByEmail.mockResolvedValue(null);
      repository.createAdminInvite.mockResolvedValue(
        makeAdminInviteRow({ id: 'invite-created' }),
      );
      const result = await service.inviteAdmin('u1', makeInviteDto());
      expect(result.email).toBe('newadmin@example.com');
      expect(mail.sendTransactional).toHaveBeenCalled();
    });

    it('rejects duplicate email on invite', async () => {
      repository.findUserRoleById.mockResolvedValue({
        id: 'u1',
        role: 'SUPER_ADMIN',
      });
      repository.findUserIdByEmail.mockResolvedValue('existing');
      await expect(
        service.inviteAdmin('u1', makeInviteDto()),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('verifyAdminInvite rejects expired/missing invite', async () => {
      repository.findValidInviteByEmail.mockResolvedValue(null);
      await expect(
        service.verifyAdminInvite({
          email: 'newadmin@example.com',
          code: '123456',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('verifyAdminInvite rejects wrong code', async () => {
      repository.findValidInviteByEmail.mockResolvedValue(
        makeAdminInviteRow({
          codeHash: cryptoUtil.sha256Hex('999999'),
        }),
      );
      await expect(
        service.verifyAdminInvite({
          email: 'newadmin@example.com',
          code: '123456',
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('verifyAdminInvite activates admin on valid code', async () => {
      const code = '654321';
      repository.findValidInviteByEmail.mockResolvedValue(
        makeAdminInviteRow({
          codeHash: cryptoUtil.sha256Hex(code),
        }),
      );
      repository.findUserIdByEmail.mockResolvedValue(null);
      const result = await service.verifyAdminInvite({
        email: 'newadmin@example.com',
        code,
        password: 'password123',
      });
      expect(result.email).toBe('newadmin@example.com');
      expect(repository.consumeInviteAndCreateAdmin).toHaveBeenCalled();
    });

    it('verifyAdminInvite maps INVITE_ALREADY_USED to Conflict', async () => {
      const code = '111111';
      repository.findValidInviteByEmail.mockResolvedValue(
        makeAdminInviteRow({
          codeHash: cryptoUtil.sha256Hex(code),
        }),
      );
      repository.findUserIdByEmail.mockResolvedValue(null);
      repository.consumeInviteAndCreateAdmin.mockRejectedValue(
        new Error('INVITE_ALREADY_USED'),
      );
      await expect(
        service.verifyAdminInvite({
          email: 'newadmin@example.com',
          code,
          password: 'password123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('forgotPassword / resetPassword', () => {
    it('returns generic message when user missing', async () => {
      repository.findUserIdByEmail.mockResolvedValue(null);
      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toEqual({
        message: 'If this email exists, a secure recovery link has been sent.',
      });
      expect(repository.setPasswordResetToken).not.toHaveBeenCalled();
    });

    it('sets reset token and returns resetLink in non-production', async () => {
      repository.findUserIdByEmail.mockResolvedValue({ id: 'user-1' });
      const result = await service.forgotPassword({
        email: 'admin@example.com',
      });
      expect(repository.setPasswordResetToken).toHaveBeenCalled();
      expect(result.resetLink).toContain('/forgot-password/reset?token=');
    });

    it('rejects invalid reset token', async () => {
      repository.findUserByValidResetToken.mockResolvedValue(null);
      await expect(
        service.resetPassword({
          token: 'bad',
          newPassword: 'password123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates password on valid token', async () => {
      repository.findUserByValidResetToken.mockResolvedValue({
        id: 'user-1',
      });
      const result = await service.resetPassword({
        token: 'good-token',
        newPassword: 'password123',
      });
      expect(result.message).toBe('Password updated successfully');
      expect(repository.updatePasswordAndClearReset).toHaveBeenCalled();
    });
  });

  describe('loginAdminGoogle', () => {
    it('rejects when Google is not configured', async () => {
      await expect(
        service.loginAdminGoogle('token-with-enough-chars-xx'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('logs in after verifying Google token', async () => {
      const harness = await createAuthServiceTestModule({
        googleClientId: 'google-client-id',
      });
      const googleService = harness.service;
      const googleRepo = harness.repository;
      googleRepo.findUserByEmail.mockResolvedValue(makeStaffUser());
      jest
        .spyOn(
          googleService as unknown as {
            verifyGoogleIdToken: (t: string) => Promise<{
              email: string;
              sub: string;
            }>;
          },
          'verifyGoogleIdToken',
        )
        .mockResolvedValue({
          email: 'admin@example.com',
          sub: 'google-sub-1',
        });

      const result = await googleService.loginAdminGoogle(
        'token-with-enough-chars-xx',
      );
      expect(result.accessToken).toBe('jwt-token');
      expect(googleRepo.bindGoogleSub).toHaveBeenCalledWith(
        'user-admin-1',
        'google-sub-1',
      );
    });

    it('rejects Google login when 2FA enabled', async () => {
      const harness = await createAuthServiceTestModule({
        googleClientId: 'google-client-id',
      });
      harness.repository.findUserByEmail.mockResolvedValue(
        makeStaffUser({ twoFactorEnabled: true }),
      );
      jest
        .spyOn(
          harness.service as unknown as {
            verifyGoogleIdToken: (t: string) => Promise<{
              email: string;
              sub: string;
            }>;
          },
          'verifyGoogleIdToken',
        )
        .mockResolvedValue({
          email: 'admin@example.com',
          sub: 'google-sub-1',
        });

      await expect(
        harness.service.loginAdminGoogle('token-with-enough-chars-xx'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
