import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServicesController } from './controllers/services.controller';
import { ServicesMediaService } from './services/services-media.service';
import { ServicesRepository } from './services/services.repository';
import { ServicesService } from './services/services.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [ServicesRepository, ServicesMediaService, ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
