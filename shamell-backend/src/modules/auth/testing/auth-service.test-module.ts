import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { createMailServiceMock } from '../../mail/__mocks__/mail.service.mock';
import { MailService } from '../../mail/services/mail.service';
import { createAuthRepositoryMock } from '../__mocks__/auth.repository.mock';
import { createJwtServiceMock } from '../__mocks__/jwt.service.mock';
import { AuthRepository } from '../services/auth.repository';
import { AuthService } from '../services/auth.service';

export type AuthServiceTestHarness = {
  moduleRef: TestingModule;
  service: AuthService;
  repository: ReturnType<typeof createAuthRepositoryMock>;
  jwt: ReturnType<typeof createJwtServiceMock>;
  mail: ReturnType<typeof createMailServiceMock>;
  config: { get: jest.Mock };
};

export type AuthServiceTestModuleOptions = {
  googleClientId?: string | undefined;
  bootstrapSecret?: string | undefined;
  nodeEnv?: string;
};

export async function createAuthServiceTestModule(
  options: AuthServiceTestModuleOptions = {},
): Promise<AuthServiceTestHarness> {
  const repository = createAuthRepositoryMock();
  const jwt = createJwtServiceMock();
  const mail = createMailServiceMock();
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'BOOTSTRAP_ADMIN_SECRET') {
        return options.bootstrapSecret !== undefined
          ? options.bootstrapSecret
          : 'secret';
      }
      if (key === 'GOOGLE_CLIENT_ID') return options.googleClientId;
      if (key === 'FRONTEND_URL') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return options.nodeEnv ?? 'test';
      if (key === 'APP_PUBLIC_NAME') return 'Shamell Admin';
      return undefined;
    }),
  };

  jwt.signAsync.mockResolvedValue('jwt-token');
  mail.isConfigured.mockReturnValue(true);
  mail.sendTransactional.mockResolvedValue({ ok: true });

  const moduleRef = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: AuthRepository, useValue: repository },
      { provide: JwtService, useValue: jwt },
      { provide: ConfigService, useValue: config },
      { provide: MailService, useValue: mail },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(AuthService),
    repository,
    jwt,
    mail,
    config,
  };
}
