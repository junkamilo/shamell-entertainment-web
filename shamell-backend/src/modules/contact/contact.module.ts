// src/modules/contact/contact.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AvailabilityModule } from '../availability/availability.module';
import { MailModule } from '../mail/mail.module';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Module({
  imports: [
    AvailabilityModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    }),
  ],
  controllers: [ContactController],
  providers: [ContactService, AdminJwtGuard],
})
export class ContactModule {}
