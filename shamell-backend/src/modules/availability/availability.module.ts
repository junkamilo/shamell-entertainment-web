import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, AdminJwtGuard],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
