import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from './admin-jwt.guard';
import { RequirePermissionsGuard } from './require-permissions.guard';

@Global()
@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  providers: [AdminJwtGuard, RequirePermissionsGuard],
  exports: [AdminJwtGuard, RequirePermissionsGuard, JwtModule],
})
export class AdminAuthModule {}
