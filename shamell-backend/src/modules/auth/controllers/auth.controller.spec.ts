import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { RequirePermissionsGuard } from '../../../common/auth/require-permissions.guard';
import { createAuthServiceMock } from '../__mocks__/auth.service.mock';
import {
  makeInviteDto,
  makeLoginDto,
  makeLoginResponse,
} from '../__mocks__/auth.fixtures';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = createAuthServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RequirePermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AuthController);
  });

  it('loginAdmin delegates to service', async () => {
    const payload = makeLoginResponse();
    authService.loginAdmin.mockResolvedValue(payload);
    const dto = makeLoginDto();
    await expect(controller.loginAdmin(dto)).resolves.toEqual(payload);
    expect(authService.loginAdmin).toHaveBeenCalledWith(dto);
  });

  it('login alias delegates to loginAdmin', async () => {
    authService.loginAdmin.mockResolvedValue(makeLoginResponse());
    const dto = makeLoginDto();
    await controller.login(dto);
    expect(authService.loginAdmin).toHaveBeenCalledWith(dto);
  });

  it('inviteAdmin passes admin id and dto', async () => {
    authService.inviteAdmin.mockResolvedValue({
      message: 'ok',
      email: 'newadmin@example.com',
    });
    const dto = makeInviteDto();
    await controller.inviteAdmin({ id: 'admin-1' }, dto);
    expect(authService.inviteAdmin).toHaveBeenCalledWith('admin-1', dto);
  });
});
