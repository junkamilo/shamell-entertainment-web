import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingQuotePaymentModel,
  BookingSource,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import {
  parseHHMM,
  utcInstantForWallClock,
} from '../availability/booking-tz';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { adminListInclude } from './booking-includes';
import { syncBookingServices } from './booking-services.util';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsQuoteService } from './bookings-quote.service';
import type { CreatePrivateClassBookingDto } from './dto/create-private-class-booking.dto';
import {
  buildPrivateClassCashConfirmationHtml,
  buildPrivateClassCashConfirmationSubject,
  buildPrivateClassCashConfirmationText,
} from './private-class-confirmation.mail';

export const PRIVATE_CLASS_DETAILS_KIND = 'private_class';

export type PrivateClassBookingDetails = {
  kind: typeof PRIVATE_CLASS_DETAILS_KIND;
  classType: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  paymentMethod: 'stripe' | 'cash';
  amountUsd: number;
  currency: 'usd';
  submittedAt: string;
  source: 'admin_book_class_private';
};

function addOneHourHhmm(hhmm: string): string {
  const minutes = parseHHMM(hhmm, 'eventTimeStart');
  const next = Math.min(minutes + 60, 23 * 60 + 59);
  const h = Math.floor(next / 60);
  const m = next % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

@Injectable()
export class BookingsPrivateClassService {
  private readonly logger = new Logger(BookingsPrivateClassService.name);

  constructor(
    private readonly prisma: PrismaService,
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
      const byId = await this.prisma.service.findUnique({
        where: { id: envId },
        select: { id: true, isActive: true },
      });
      if (byId?.isActive) return byId.id;
      throw new BadRequestException(
        'PRIVATE_CLASS_SERVICE_ID does not match an active catalog service.',
      );
    }

    const byCode = await this.prisma.service.findFirst({
      where: {
        isActive: true,
        serviceType: {
          isActive: true,
          contactInquiryCode: 'PRIVATE_CLASS',
        },
      },
      select: { id: true },
    });
    if (byCode) return byCode.id;

    const byName = await this.prisma.service.findFirst({
      where: {
        isActive: true,
        serviceType: {
          isActive: true,
          name: { equals: 'Private Class', mode: 'insensitive' },
        },
      },
      select: { id: true },
    });
    if (byName) return byName.id;

    throw new BadRequestException(
      'Private Class catalog service is not configured. Set PRIVATE_CLASS_SERVICE_ID or seed a ServiceType named "Private Class" (contactInquiryCode PRIVATE_CLASS).',
    );
  }

  private buildDetails(
    dto: CreatePrivateClassBookingDto,
    paymentMethod: 'stripe' | 'cash',
  ): PrivateClassBookingDetails {
    const start = dto.eventTimeStart.trim();
    const end = addOneHourHhmm(start);
    const amount = Number(dto.amountUsd);
    if (!Number.isFinite(amount) || amount < 1) {
      throw new BadRequestException('amountUsd must be at least 1.');
    }
    return {
      kind: PRIVATE_CLASS_DETAILS_KIND,
      classType: dto.classType.trim(),
      eventTimeStart: start,
      eventTimeEnd: end,
      location: dto.location.trim(),
      paymentMethod,
      amountUsd: Number(amount.toFixed(2)),
      currency: 'usd',
      submittedAt: new Date().toISOString(),
      source: 'admin_book_class_private',
    };
  }

  private eventInstantFromDateAndTime(
    dateISO: string,
    hhmm: string,
  ): Date {
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

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          serviceId,
          eventDate,
          location: details.location,
          notes: dto.notes?.trim() || null,
          status,
          totalAmount: amount,
          quoteTotalAmount: amount,
          quoteCurrency: 'usd',
          bookingDetails: details as unknown as Prisma.InputJsonValue,
          source: BookingSource.ADMIN_PHONE,
          createdByAdminId: adminUserId,
          guestFullName: dto.customerName.trim(),
          guestEmail: dto.customerEmail.trim().toLowerCase(),
          guestPhone: dto.customerPhone?.trim() || null,
        },
        include: adminListInclude,
      });

      await syncBookingServices(tx, booking.id, [serviceId]);

      return tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: adminListInclude,
      });
    });
  }

  async createCash(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
  ): Promise<{ bookingId: string; message: string }> {
    const details = this.buildDetails(dto, 'cash');
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
    const details = this.buildDetails(dto, 'stripe');
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
      this.logger.error(
        `Private class ${booking.id}: cash confirmation email error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
