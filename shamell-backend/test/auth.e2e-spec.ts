import { UnauthorizedException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createAuthServiceMock } from '../src/modules/auth/__mocks__/auth.service.mock';
import { makeLoginResponse } from '../src/modules/auth/__mocks__/auth.fixtures';
import { createAuthHttpApp } from '../src/modules/auth/testing/auth-http-app';
import type {
  AdminLoginBody,
  ErrorBody,
  ForgotPasswordBody,
  InviteSentBody,
  InviteVerifiedBody,
  ResetPasswordBody,
} from '../src/modules/auth/testing/auth.test-types';

describe('Auth (contract e2e)', () => {
  let app: INestApplication<App>;
  const authService = createAuthServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createAuthHttpApp({
        guardsAllow: false,
        authService,
      });
      app = created.app;
    });

    it('POST /admin/invite returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/invite')
        .send({ email: 'a@example.com', fullName: 'A' })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });
  });

  describe('with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createAuthHttpApp({
        guardsAllow: true,
        authService,
      });
      app = created.app;
    });

    it('POST /admin/login returns typed login body', async () => {
      authService.loginAdmin.mockResolvedValue(makeLoginResponse());
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(200);
      const body = res.body as AdminLoginBody;
      expect(body.accessToken).toBe('jwt-token');
      expect(body.user.email).toBe('admin@example.com');
    });

    it('POST /login alias returns typed login body', async () => {
      authService.loginAdmin.mockResolvedValue(makeLoginResponse());
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(200);
      const body = res.body as AdminLoginBody;
      expect(body.accessToken).toBeTruthy();
    });

    it('POST /admin/invite returns typed invite body', async () => {
      authService.inviteAdmin.mockResolvedValue({
        message: 'Verification code sent.',
        email: 'new@example.com',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/invite')
        .send({ email: 'new@example.com', fullName: 'New Admin' })
        .expect(201);
      const body = res.body as InviteSentBody;
      expect(body.email).toBe('new@example.com');
    });

    it('POST /admin/invite/verify returns typed body', async () => {
      authService.verifyAdminInvite.mockResolvedValue({
        message: 'Admin account activated.',
        email: 'new@example.com',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/invite/verify')
        .send({
          email: 'new@example.com',
          code: '123456',
          password: 'password123',
        })
        .expect(201);
      const body = res.body as InviteVerifiedBody;
      expect(body.email).toBe('new@example.com');
    });

    it('POST /forgot-password returns generic message', async () => {
      authService.forgotPassword.mockResolvedValue({
        message: 'If this email exists, a secure recovery link has been sent.',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'a@example.com' })
        .expect(200);
      const body = res.body as ForgotPasswordBody;
      expect(body.message).toContain('If this email exists');
    });

    it('POST /reset-password returns success message', async () => {
      authService.resetPassword.mockResolvedValue({
        message: 'Password updated successfully',
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'tok', newPassword: 'password123' })
        .expect(200);
      const body = res.body as ResetPasswordBody;
      expect(body.message).toBe('Password updated successfully');
    });

    it('POST /admin/login Unauthorized includes x-request-id', async () => {
      authService.loginAdmin.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({ email: 'bad@example.com', password: 'password123' })
        .expect(401);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(401);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });
  });
});
