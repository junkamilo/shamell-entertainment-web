import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutController } from './controllers/floor-layout.controller';
import { FloorLayoutRepository } from './services/floor-layout.repository';
import { FloorLayoutService } from './services/floor-layout.service';

@Module({
  imports: [PrismaModule],
  controllers: [FloorLayoutController],
  providers: [FloorLayoutRepository, FloorLayoutService],
  exports: [FloorLayoutService],
})
export class FloorLayoutModule {}
