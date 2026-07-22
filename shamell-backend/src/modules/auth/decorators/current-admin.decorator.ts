import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export type AdminJwtPayload = {
  id: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminJwtPayload => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ adminUser?: AdminJwtPayload }>();
    const admin = req.adminUser;
    if (!admin?.id) {
      throw new UnauthorizedException('Admin context missing.');
    }
    return admin;
  },
);
