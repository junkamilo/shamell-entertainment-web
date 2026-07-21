import { Module } from '@nestjs/common';
import { AdminPaymentsModule } from '../admin-payments/admin-payments.module';
import { ContactModule } from '../contact/contact.module';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';

@Module({
  imports: [ContactModule, AdminPaymentsModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
