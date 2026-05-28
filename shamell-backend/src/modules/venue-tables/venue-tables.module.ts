import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { VenueTablesController } from './venue-tables.controller';
import { VenueTablesService } from './venue-tables.service';

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
  controllers: [VenueTablesController],
  providers: [VenueTablesService, AdminJwtGuard],
})
export class VenueTablesModule {}
