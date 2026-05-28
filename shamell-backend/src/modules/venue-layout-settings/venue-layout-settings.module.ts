import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { VenueLayoutPublicController } from './venue-layout-public.controller';
import { VenueLayoutSettingsController } from './venue-layout-settings.controller';
import { VenueLayoutSettingsService } from './venue-layout-settings.service';

@Module({
  imports: [
    PrismaModule,
    FloorLayoutModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [VenueLayoutSettingsController, VenueLayoutPublicController],
  providers: [VenueLayoutSettingsService, AdminJwtGuard],
  exports: [VenueLayoutSettingsService],
})
export class VenueLayoutSettingsModule {}
