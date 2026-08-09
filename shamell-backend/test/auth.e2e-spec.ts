import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../src/modules/auth/services/auth.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';
import { RequirePermissionsGuard } from '../src/common/auth/require-permissions.guard';

describe('Auth (e2e smoke)', () => {
  let app: INestApplication<App>;
  const authService = {
    bootstrapAdmin: jest.fn(),
    loginAdmin: jest.fn(),
    loginAdminGoogle: jest.fn(),
    inviteAdmin: jest.fn(),
    verifyAdminInvite: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  async function createApp(guardsAllow: boolean) {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => guardsAllow })
      .overrideGuard(RequirePermissionsGuard)
      .useValue({ canActivate: () => guardsAllow })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  }

  it('POST /api/v1/auth/admin/invite is forbidden without auth', async () => {
    await createApp(false);

    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/invite')
      .send({ email: 'a@example.com', fullName: 'A' })
      .expect(403);
  });

  it('POST /api/v1/auth/admin/login returns mocked body when service succeeds', async () => {
    jest.clearAllMocks();
    authService.loginAdmin.mockResolvedValue({
      message: 'Login successful',
      accessToken: 'token',
      user: {
        id: '1',
        fullName: 'Ada',
        email: 'ada@example.com',
        role: 'ADMIN',
        permissions: [],
      },
    });

    await createApp(true);

    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({ email: 'ada@example.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        const body = res.body as { accessToken: string };
        expect(body.accessToken).toBe('token');
      });
  });
});
