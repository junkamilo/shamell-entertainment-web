import { Module } from '@nestjs/common';
import { FloorLayoutModule } from '../floor-layout/floor-layout.module';
import { AdminPaymentsController } from './controllers/admin-payments.controller';
import { AdminPaymentsRepository } from './services/admin-payments.repository';
import { AdminPaymentsService } from './services/admin-payments.service';

@Module({
  imports: [FloorLayoutModule],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsRepository, AdminPaymentsService],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}
