import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminJwtGuard } from '../contact/guards/admin-jwt.guard';
import { UpcomingEventsModule } from '../upcoming-events/upcoming-events.module';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';

@Module({
  imports: [
    UpcomingEventsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService, AdminJwtGuard],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}
