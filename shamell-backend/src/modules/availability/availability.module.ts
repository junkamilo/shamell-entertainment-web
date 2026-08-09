import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AvailabilityController } from './controllers/availability.controller';
import { AvailabilityRepository } from './services/availability.repository';
import { AvailabilityService } from './services/availability.service';

@Module({
  imports: [PrismaModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityRepository, AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
