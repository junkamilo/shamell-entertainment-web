import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { StandaloneChairsController } from './standalone-chairs.controller';
import { StandaloneChairsService } from './standalone-chairs.service';

@Module({
  imports: [PrismaModule, FloorLayoutModule],
  controllers: [StandaloneChairsController],
  providers: [StandaloneChairsService],
})
export class StandaloneChairsModule {}
