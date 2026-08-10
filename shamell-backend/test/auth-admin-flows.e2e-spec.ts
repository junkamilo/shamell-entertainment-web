import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { createAuthServiceMock } from '../src/modules/auth/__mocks__/auth.service.mock';
import {
  makeAdminInviteRow,
  makeInviteDto,
  makeLoginDto,
  makeStaffUser,
} from '../src/modules/auth/__mocks__/auth.fixtures';
import { createAuthHttpApp } from '../src/modules/auth/testing/auth-http-app';
import { createAuthServiceTestModule } from '../src/modules/auth/testing/auth-service.test-module';
import type {
  AdminLoginBody,
  ErrorBody,
  InviteSentBody,
  InviteVerifiedBody,
} from '../src/modules/auth/testing/auth.test-types';
import * as cryptoUtil from '../src/modules/auth/utils/auth-crypto.util';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createAuthServiceTestModule>
  >['repository'];
  mail: Awaited<ReturnType<typeof createAuthServiceTestModule>>['mail'];
};

async function createDeepAuthHttpApp(): Promise<DeepHarness> {
  const harness = await createAuthServiceTestModule();
  const authService = {
    ...createAuthServiceMock(),
    loginAdmin: (dto: unknown) =>
      harness.service.loginAdmin(
        dto as Parameters<typeof harness.service.loginAdmin>[0],
      ),
    inviteAdmin: (inviterId: string, dto: unknown) =>
      harness.service.inviteAdmin(
        inviterId,
        dto as Parameters<typeof harness.service.inviteAdmin>[1],
      ),
    verifyAdminInvite: (dto: unknown) =>
      harness.service.verifyAdminInvite(
        dto as Parameters<typeof harness.service.verifyAdminInvite>[0],
      ),
    forgotPassword: (dto: unknown) =>
      harness.service.forgotPassword(
        dto as Parameters<typeof harness.service.forgotPassword>[0],
      ),
    resetPassword: (dto: unknown) =>
      harness.service.resetPassword(
        dto as Parameters<typeof harness.service.resetPassword>[0],
      ),
  };

  const { app } = await createAuthHttpApp({
    guardsAllow: true,
    authService,
  });

  return {
    app,
    repository: harness.repository,
    mail: harness.mail,
  };
}

describe('Auth admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let mail: DeepHarness['mail'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepAuthHttpApp();
    app = created.app;
    repository = created.repository;
    mail = created.mail;
  }

  it('POST /admin/login succeeds via real AuthService', async () => {
    await boot();
    repository.findUserByEmail.mockResolvedValue(
      makeStaffUser({
        password: await cryptoUtil.hashPassword('password123'),
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send(makeLoginDto())
      .expect(200);

    const body = res.body as AdminLoginBody;
    expect(body.accessToken).toBe('jwt-token');
    expect(body.user.email).toBe('admin@example.com');
  });

  it('POST /admin/login returns 401 for bad credentials', async () => {
    await boot();
    repository.findUserByEmail.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send(makeLoginDto())
      .expect(401);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(401);
  });

  it('POST /admin/invite sends code via real AuthService', async () => {
    await boot();
    repository.findUserRoleById.mockResolvedValue({
      id: 'admin-e2e-test',
      role: 'SUPER_ADMIN',
    });
    repository.findUserIdByEmail.mockResolvedValue(null);
    repository.createAdminInvite.mockResolvedValue(makeAdminInviteRow());

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/invite')
      .send(makeInviteDto())
      .expect(201);

    const body = res.body as InviteSentBody;
    expect(body.email).toBe('newadmin@example.com');
    expect(mail.sendTransactional).toHaveBeenCalled();
  });

  it('POST /admin/invite/verify activates invite', async () => {
    await boot();
    const code = '654321';
    repository.findValidInviteByEmail.mockResolvedValue(
      makeAdminInviteRow({
        codeHash: cryptoUtil.sha256Hex(code),
      }),
    );
    repository.findUserIdByEmail.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/invite/verify')
      .send({
        email: 'newadmin@example.com',
        code,
        password: 'password123',
      })
      .expect(201);

    const body = res.body as InviteVerifiedBody;
    expect(body.email).toBe('newadmin@example.com');
    expect(repository.consumeInviteAndCreateAdmin).toHaveBeenCalled();
  });
});
