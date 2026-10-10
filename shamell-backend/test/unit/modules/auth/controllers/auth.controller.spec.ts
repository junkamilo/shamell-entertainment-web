import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { RequirePermissionsGuard } from '@app/common/auth/guards/require-permissions.guard';
import { createAuthServiceMock } from '@test-support/modules/auth/mocks/auth.service.mock';
import {
  makeInviteDto,
  makeLoginDto,
  makeLoginResponse,
} from '@test-support/modules/auth/fixtures/auth.fixtures';
import { AuthService } from '@app/modules/auth/services/auth.service';
import { AuthController } from '@app/modules/auth/controllers/auth.controller';

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

  it('loginAdmin delega al servicio', async () => {
    const payload = makeLoginResponse();
    authService.loginAdmin.mockResolvedValue(payload);
    const dto = makeLoginDto();
    await expect(controller.loginAdmin(dto)).resolves.toEqual(payload);
    expect(authService.loginAdmin).toHaveBeenCalledWith(dto);
  });

  it('el alias login delega a loginAdmin', async () => {
    authService.loginAdmin.mockResolvedValue(makeLoginResponse());
    const dto = makeLoginDto();
    await controller.login(dto);
    expect(authService.loginAdmin).toHaveBeenCalledWith(dto);
  });

  it('inviteAdmin pasa el id del administrador y el dto', async () => {
    authService.inviteAdmin.mockResolvedValue({
      message: 'ok',
      email: 'newadmin@example.com',
    });
    const dto = makeInviteDto();
    await controller.inviteAdmin({ id: 'admin-1' }, dto);
    expect(authService.inviteAdmin).toHaveBeenCalledWith('admin-1', dto);
  });

  it('loginAdmin propaga UnauthorizedException del servicio', async () => {
    authService.loginAdmin.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );
    await expect(controller.loginAdmin(makeLoginDto())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('inviteAdmin propaga ForbiddenException del servicio', async () => {
    authService.inviteAdmin.mockRejectedValue(
      new ForbiddenException('Missing required admin permission.'),
    );
    await expect(
      controller.inviteAdmin({ id: 'admin-1' }, makeInviteDto()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
