import { Module } from '@nestjs/common';
import { PerformersController } from './performers.controller';
import { PerformersService } from './performers.service';

@Module({
  controllers: [PerformersController],
  providers: [PerformersService],
})
export class PerformersModule {}
