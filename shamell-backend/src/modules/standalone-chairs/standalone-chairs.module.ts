import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { StandaloneChairsController } from './controllers/standalone-chairs.controller';
import { StandaloneChairsRepository } from './services/standalone-chairs.repository';
import { StandaloneChairsService } from './services/standalone-chairs.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [StandaloneChairsController],
  providers: [StandaloneChairsRepository, StandaloneChairsService],
})
export class StandaloneChairsModule {}
