import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { resolveJwtSecret } from '../config/jwt-secret.util';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from './guards/admin-jwt.guard';
import { RequirePermissionsGuard } from './guards/require-permissions.guard';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: resolveJwtSecret(),
    }),
  ],
  providers: [AdminJwtGuard, RequirePermissionsGuard],
  exports: [AdminJwtGuard, RequirePermissionsGuard, JwtModule],
})
export class AdminAuthModule {}
