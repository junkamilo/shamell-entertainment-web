import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  type AdminPermission,
  hasAdminPermission,
} from './admin-permissions';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';

export const RequirePermissions = (...permissions: AdminPermission[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

type AdminRequestUser = {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

@Injectable()
export class RequirePermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminPermission[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      adminUser?: AdminRequestUser;
    }>();
    const admin = request.adminUser;
    if (!admin?.id) {
      throw new UnauthorizedException('Admin context missing.');
    }

    if (!hasAdminPermission(admin.permissions, required)) {
      throw new ForbiddenException('Missing required admin permission.');
    }

    return true;
  }
}
