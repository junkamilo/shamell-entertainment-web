import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReservationEventTemplatesController } from './controllers/reservation-event-templates.controller';
import { ReservationEventTemplatesRepository } from './services/reservation-event-templates.repository';
import { ReservationEventTemplatesService } from './services/reservation-event-templates.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationEventTemplatesController],
  providers: [
    ReservationEventTemplatesRepository,
    ReservationEventTemplatesService,
  ],
  exports: [ReservationEventTemplatesService],
})
export class ReservationEventTemplatesModule {}
