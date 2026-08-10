import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingQuotePaymentModel,
  BookingSource,
  BookingStatus,
} from '@prisma/client';
import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';
import { AvailabilityService } from '../../availability/services/availability.service';
import {
  parseHHMM,
  utcInstantForWallClock,
} from '../../availability/utils/booking-tz';
import { emailBrandingFromConfig } from '../../mail/utils/email-html-branding';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsQuoteService } from './bookings-quote.service';
import { BookingsRepository } from './bookings.repository';
import type { CreatePrivateClassBookingDto } from '../dto/create-private-class-booking.dto';
import type { PrivateClassBookingDetails } from '../types/bookings.types';
import { buildPrivateClassDetails } from '../utils/private-class-details.util';
import {
  buildPrivateClassCashConfirmationHtml,
  buildPrivateClassCashConfirmationSubject,
  buildPrivateClassCashConfirmationText,
} from '../mail/private-class-confirmation.mail';

@Injectable()
export class BookingsPrivateClassService {
  private readonly logger = new Logger(BookingsPrivateClassService.name);

  constructor(
    private readonly repository: BookingsRepository,
    private readonly availability: AvailabilityService,
    private readonly admin: BookingsAdminService,
    private readonly quote: BookingsQuoteService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly config: ConfigService,
  ) {}

  private usd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  private async resolvePrivateClassServiceId(): Promise<string> {
    const envId = this.config.get<string>('PRIVATE_CLASS_SERVICE_ID')?.trim();
    if (envId) {
      const byId = await this.repository.findActiveServiceById(envId);
      if (byId?.isActive) return byId.id;
      throw new BadRequestException(
        'PRIVATE_CLASS_SERVICE_ID does not match an active catalog service.',
      );
    }

    const byCode = await this.repository.findPrivateClassServiceByCode();
    if (byCode) return byCode.id;

    const byName = await this.repository.findPrivateClassServiceByName();
    if (byName) return byName.id;

    throw new BadRequestException(
      'Private Class catalog service is not configured. Set PRIVATE_CLASS_SERVICE_ID or seed a ServiceType named "Private Class" (contactInquiryCode PRIVATE_CLASS).',
    );
  }

  private eventInstantFromDateAndTime(dateISO: string, hhmm: string): Date {
    const tz = this.availability.bookingTimeZone();
    const minutes = parseHHMM(hhmm, 'eventTimeStart');
    return utcInstantForWallClock(dateISO, minutes, tz);
  }

  private async createBookingRow(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
    details: PrivateClassBookingDetails,
    status: BookingStatus,
  ) {
    const serviceId = await this.resolvePrivateClassServiceId();
    const eventDate = this.eventInstantFromDateAndTime(
      dto.eventDate,
      details.eventTimeStart,
    );

    await this.availability.assertDateTimeAllowed(eventDate);
    await this.admin.assertNoDuplicateSlot(eventDate, details);

    const amount = details.amountUsd;

    return this.repository.createPrivateClassBookingWithServices({
      serviceId,
      data: {
        serviceId,
        eventDate,
        location: details.location,
        notes: dto.notes?.trim() || null,
        status,
        totalAmount: amount,
        quoteTotalAmount: amount,
        quoteCurrency: 'usd',
        bookingDetails: details,
        source: BookingSource.ADMIN_PHONE,
        createdByAdminId: adminUserId,
        guestFullName: dto.customerName.trim(),
        guestEmail: dto.customerEmail.trim().toLowerCase(),
        guestPhone: dto.customerPhone?.trim() || null,
      },
    });
  }

  async createCash(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
  ): Promise<{ bookingId: string; message: string }> {
    const details = buildPrivateClassDetails(dto, 'cash');
    const booking = await this.createBookingRow(
      adminUserId,
      dto,
      details,
      BookingStatus.CONFIRMED,
    );

    await this.sendCashConfirmation(booking, details);
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'BOOKING_QUOTE',
      customerName: booking.guestFullName ?? dto.customerName,
      customerEmail: booking.guestEmail ?? dto.customerEmail,
      amount: details.amountUsd,
      currency: 'usd',
      contextLabel: `Private class — ${details.classType}`,
      reference: booking.id.slice(0, 8).toUpperCase(),
      stage: 'FULL',
    });

    return {
      bookingId: booking.id,
      message: 'Private class reserved.',
    };
  }

  async createCheckoutSession(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
  ): Promise<{
    bookingId: string;
    quoteId: string;
    message: string;
    payUrl?: string;
  }> {
    const details = buildPrivateClassDetails(dto, 'stripe');
    const booking = await this.createBookingRow(
      adminUserId,
      dto,
      details,
      BookingStatus.PENDING,
    );

    const quoteResult = await this.quote.createBookingQuote(
      adminUserId,
      booking.id,
      {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: details.amountUsd,
        currency: 'usd',
      },
    );

    return {
      bookingId: booking.id,
      quoteId: quoteResult.quoteId,
      message: quoteResult.message,
    };
  }

  private async sendCashConfirmation(
    booking: {
      id: string;
      guestFullName: string | null;
      guestEmail: string | null;
      location: string;
      eventDate: Date;
    },
    details: PrivateClassBookingDetails,
  ): Promise<void> {
    const toEmail = booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) {
      this.logger.warn(
        `Private class ${booking.id}: cash confirmation skipped (no email).`,
      );
      return;
    }

    const branding = emailBrandingFromConfig(this.config);
    const customerName = booking.guestFullName?.trim() || 'Guest';
    const confirmationReference = booking.id.slice(0, 8).toUpperCase();
    const dateLabel = booking.eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: this.availability.bookingTimeZone(),
    });
    const sessionLabel = `${dateLabel} · ${details.eventTimeStart}`;

    try {
      await this.mail.sendTransactional({
        to: toEmail,
        toName: customerName,
        subject: buildPrivateClassCashConfirmationSubject(details.classType),
        html: buildPrivateClassCashConfirmationHtml({
          classType: details.classType,
          customerName,
          sessionLabel,
          location: details.location,
          amount: this.usd(details.amountUsd),
          confirmationReference,
          branding,
        }),
        text: buildPrivateClassCashConfirmationText({
          classType: details.classType,
          customerName,
          sessionLabel,
          location: details.location,
          amount: this.usd(details.amountUsd),
          confirmationReference,
          siteBaseUrl: branding.siteBaseUrl,
        }),
      });
    } catch (err) {
      logCaughtError(this.logger, err, {
        op: 'mail.private_class_cash_confirmation',
        level: 'error',
        extra: { bookingId: booking.id },
      });
    }
  }
}
