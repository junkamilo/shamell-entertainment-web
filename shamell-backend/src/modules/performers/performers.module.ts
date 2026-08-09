import { Module } from '@nestjs/common';
import { PerformersController } from './controllers/performers.controller';
import { PerformersService } from './services/performers.service';

@Module({
  controllers: [PerformersController],
  providers: [PerformersService],
})
export class PerformersModule {}
