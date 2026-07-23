import { Injectable } from '@nestjs/common';
import type { SanitizedInquiryDetails } from '../booking-inquiry/contact-inquiry-details';
import type { CreateContactDto } from '../contact/dto/create-contact.dto';
import type { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import type { AdminCalendarQueryDto } from './dto/admin-calendar-query.dto';
import type { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import type { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import type { CreatePrivateClassBookingDto } from './dto/create-private-class-booking.dto';
import { CreateBookingQuoteDto } from './dto/create-booking-quote.dto';
import { SendBookingBalanceLinkDto } from './dto/send-booking-balance-link.dto';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsInquiryService } from './bookings-inquiry.service';
import type {
  CreateFromPublicBookingInquiryOptions,
  PublicBookingInquiryPrepared,
} from './bookings-inquiry.service';
import { BookingsPrivateClassService } from './bookings-private-class.service';
import { BookingsQuoteService } from './bookings-quote.service';
import { BookingsWebhookService } from './bookings-webhook.service';
import type { BookingWithRelations } from './booking-includes';

export type {
  CreateFromPublicBookingInquiryOptions,
  PublicBookingInquiryPrepared,
} from './bookings-inquiry.service';
export type { BookingWithRelations } from './booking-includes';

@Injectable()
export class BookingsService {
  constructor(
    private readonly admin: BookingsAdminService,
    private readonly inquiry: BookingsInquiryService,
    private readonly quote: BookingsQuoteService,
    private readonly webhook: BookingsWebhookService,
    private readonly privateClass: BookingsPrivateClassService,
  ) {}

  getPublicOccupiedByDate(dateISO: string) {
    return this.admin.getPublicOccupiedByDate(dateISO);
  }

  createAdminBooking(adminUserId: string, dto: CreateAdminBookingDto) {
    return this.admin.createAdminBooking(adminUserId, dto);
  }

  createPrivateClassCash(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
  ) {
    return this.privateClass.createCash(adminUserId, dto);
  }

  createPrivateClassCheckoutSession(
    adminUserId: string,
    dto: CreatePrivateClassBookingDto,
  ) {
    return this.privateClass.createCheckoutSession(adminUserId, dto);
  }

  notifyBookingCreated(booking: BookingWithRelations): Promise<void> {
    return this.inquiry.notifyBookingCreated(booking);
  }

  preparePublicBookingInquiry(
    dto: CreateContactDto,
    enriched: SanitizedInquiryDetails,
    logContextId = 'pending',
  ): Promise<PublicBookingInquiryPrepared | null> {
    return this.inquiry.preparePublicBookingInquiry(
      dto,
      enriched,
      logContextId,
    );
  }

  insertPublicBookingInquiry(
    contactRequestId: string,
    prepared: PublicBookingInquiryPrepared,
    options?: CreateFromPublicBookingInquiryOptions,
  ) {
    return this.inquiry.insertPublicBookingInquiry(
      contactRequestId,
      prepared,
      options,
    );
  }

  createFromPublicBookingInquiry(
    contactRequestId: string,
    dto: CreateContactDto,
    enriched: SanitizedInquiryDetails,
    options?: CreateFromPublicBookingInquiryOptions,
  ) {
    return this.inquiry.createFromPublicBookingInquiry(
      contactRequestId,
      dto,
      enriched,
      options,
    );
  }

  findAllAdmin(query: AdminBookingQueryDto) {
    return this.admin.findAllAdmin(query);
  }

  findCalendarAdmin(query: AdminCalendarQueryDto) {
    return this.admin.findCalendarAdmin(query);
  }

  findOneAdmin(id: string) {
    return this.admin.findOneAdmin(id);
  }

  updateAdmin(id: string, dto: UpdateAdminBookingDto) {
    return this.admin.updateAdmin(id, dto);
  }

  removeAdmin(id: string, options?: { purgeContact?: boolean }) {
    return this.admin.removeAdmin(id, options);
  }

  createBookingQuote(
    adminUserId: string,
    bookingId: string,
    dto: CreateBookingQuoteDto,
  ) {
    return this.quote.createBookingQuote(adminUserId, bookingId, dto);
  }

  sendBookingBalanceLink(
    adminUserId: string,
    bookingId: string,
    dto: SendBookingBalanceLinkDto,
  ) {
    return this.quote.sendBookingBalanceLink(adminUserId, bookingId, dto);
  }

  resolveQuotePayUrl(token: string): string {
    return this.quote.resolveQuotePayUrl(token);
  }

  resolveQuoteCheckoutClientSecret(token: string): Promise<string> {
    return this.quote.resolveQuoteCheckoutClientSecret(token);
  }

  getQuotePaymentSessionStatus(sessionId: string) {
    return this.quote.getQuotePaymentSessionStatus(sessionId);
  }

  handleBookingPaymentsWebhook(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ) {
    return this.webhook.handleBookingPaymentsWebhook(rawBody, signature);
  }

  processStripeWebhookEvent(event: {
    id: string;
    type: string;
    data: { object: unknown };
  }): Promise<{ received: true; handled: boolean }> {
    return this.webhook.processStripeWebhookEvent(event);
  }
}
