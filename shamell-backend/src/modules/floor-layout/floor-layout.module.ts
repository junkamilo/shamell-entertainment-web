import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FloorLayoutController } from './floor-layout.controller';
import { FloorLayoutService } from './floor-layout.service';

@Module({
  imports: [PrismaModule],
  controllers: [FloorLayoutController],
  providers: [FloorLayoutService],
  exports: [FloorLayoutService],
})
export class FloorLayoutModule {}
