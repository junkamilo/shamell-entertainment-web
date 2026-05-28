import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { ReservationEventTemplatesController } from './reservation-event-templates.controller';
import { ReservationEventTemplatesService } from './reservation-event-templates.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as never,
      },
    }),
  ],
  controllers: [ReservationEventTemplatesController],
  providers: [ReservationEventTemplatesService, AdminJwtGuard],
  exports: [ReservationEventTemplatesService],
})
export class ReservationEventTemplatesModule {}
