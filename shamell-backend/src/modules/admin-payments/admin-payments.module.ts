import { Module } from '@nestjs/common';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminPaymentsService } from './admin-payments.service';

@Module({
  imports: [FloorLayoutModule],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}
