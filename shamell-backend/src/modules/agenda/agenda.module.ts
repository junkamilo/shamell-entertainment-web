import { Module } from '@nestjs/common';
import { AdminPaymentsModule } from '../admin-payments/admin-payments.module';
import { ContactModule } from '../contact/contact.module';
import { AgendaController } from './controllers/agenda.controller';
import { AgendaRepository } from './services/agenda.repository';
import { AgendaService } from './services/agenda.service';

@Module({
  imports: [ContactModule, AdminPaymentsModule],
  controllers: [AgendaController],
  providers: [AgendaRepository, AgendaService],
})
export class AgendaModule {}
