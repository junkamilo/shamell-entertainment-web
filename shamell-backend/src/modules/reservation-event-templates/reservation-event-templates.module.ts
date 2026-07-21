import { Module } from '@nestjs/common';
import { ReservationEventTemplatesController } from './reservation-event-templates.controller';
import { ReservationEventTemplatesService } from './reservation-event-templates.service';

@Module({
  controllers: [ReservationEventTemplatesController],
  providers: [ReservationEventTemplatesService],
  exports: [ReservationEventTemplatesService],
})
export class ReservationEventTemplatesModule {}
