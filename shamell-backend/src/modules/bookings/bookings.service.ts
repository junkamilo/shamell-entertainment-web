import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingQuotePaymentModel,
  BookingQuoteStatus,
  BookingSource,
  BookingStatus,
  ContactRequestStatus,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { maskCustomerName, maskEmail } from '../../common/util/mask-pii.util';
import { AvailabilityService } from '../availability/availability.service';
import {
  parseHHMM,
  utcInstantForWallClock,
  zonedWallClock,
} from '../availability/booking-tz';
import {
  sanitizeInquiryDetails,
  type SanitizedInquiryDetails,
} from '../contact/contact-inquiry-details';
import type { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import type { CreateContactDto } from '../contact/dto/create-contact.dto';
import {
  bookingDetailsForPublicInquiry,
  resolvePrimaryServiceIdForInquiry,
} from '../contact/contact-inquiry-booking';
import type { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import type { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';
import {
  buildBookingConfirmationHtml,
  buildBookingConfirmationSubject,
  buildBookingConfirmationText,
  timesFromDetails,
  type BookingConfirmationTemplateInput,
} from './booking-confirmation.mail';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import { AdminCustomerActivityNotifyService } from '../mail/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from '../mail/admin-payment-notify.service';
import { STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS } from '../stripe/stripe-embedded-checkout.util';
import {
  assertCheckoutPaidAmounts,
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../stripe/stripe-tax.util';
import { StripeService } from '../stripe/stripe.service';
import { CreateBookingQuoteDto } from './dto/create-booking-quote.dto';
import { SendBookingBalanceLinkDto } from './dto/send-booking-balance-link.dto';
import {
  buildBookingBalanceLinkHtml,
  buildBookingBalanceLinkSubject,
  buildBookingBalanceLinkText,
  buildBookingDepositPaidHtml,
  buildBookingDepositPaidSubject,
  buildBookingDepositPaidText,
  buildBookingFullyPaidHtml,
  buildBookingFullyPaidSubject,
  buildBookingFullyPaidText,
  buildBookingQuoteHtml,
  buildBookingQuoteSubject,
  buildBookingQuoteText,
} from './booking-quote.mail';

const bookingInclude = {
  service: { include: { serviceType: true } },
  eventType: true,
  occasionType: true,
  event: true,
  user: true,
  createdByAdmin: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.BookingInclude;

type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

type PrismaTx = Prisma.TransactionClient;
type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string | undefined>;
  payment_status?: string | null;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
  payment_intent?: string | { id?: string } | null;
};
const QUOTE_TOKEN_TTL_HOURS = 72;
const CHECKOUT_TTL_MINUTES = 45;

export type CreateFromPublicBookingInquiryOptions = {
  tx?: PrismaTx;
  /** When true, caller sends confirmation after the surrounding transaction commits. */
  skipConfirmationEmail?: boolean;
};

/** Pre-validated payload for a single `booking.create` inside a short transaction. */
export type PublicBookingInquiryPrepared = {
  serviceId: string;
  eventTypeId: string | null;
  occasionTypeId: string | null;
  eventId: string | null;
  eventDate: Date;
  location: string;
  guestCount: number | null;
  notes: string | null;
  bookingDetails: Prisma.InputJsonValue;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly mail: MailService,
    private readonly adminActivityNotify: AdminCustomerActivityNotifyService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
  ) {}

  /** Public SPA origin for pay links and email footers (skips localhost in production). */
  private emailBrandingForTemplates() {
    return emailBrandingFromConfig(this.config);
  }

  private async enrichBookingDetails(
    details: SanitizedInquiryDetails,
  ): Promise<SanitizedInquiryDetails> {
    const out: SanitizedInquiryDetails = { ...details };
    const ids = new Set<string>();
    if (details.occasionTypeId) ids.add(details.occasionTypeId);
    details.occasionTypeIdsProject?.forEach((i) => ids.add(i));
    details.occasionTypeIdsRole?.forEach((i) => ids.add(i));
    if (ids.size > 0) {
      const rows = await this.prisma.occasionType.findMany({
        where: { id: { in: [...ids] } },
        select: { id: true, name: true },
      });
      const map = Object.fromEntries(rows.map((r) => [r.id, r.name]));
      if (details.occasionTypeId) {
        const n = map[details.occasionTypeId];
        if (n) out.occasionSingleLabel = n;
      }
      if (details.occasionTypeIdsProject?.length) {
        out.bespokeProjectLabels = details.occasionTypeIdsProject
          .map((id) => map[id])
          .filter((label): label is string => Boolean(label));
      }
      if (details.occasionTypeIdsRole?.length) {
        out.bespokeRoleLabels = details.occasionTypeIdsRole
          .map((id) => map[id])
          .filter((label): label is string => Boolean(label));
      }
    }
    if (details.eventTypeId) {
      const et = await this.prisma.eventType.findUnique({
        where: { id: details.eventTypeId },
        select: { name: true },
      });
      if (et) out.eventTypeLabel = et.name;
    }
    if (details.serviceIds?.length) {
      const rows = await this.prisma.service.findMany({
        where: { id: { in: details.serviceIds } },
        select: {
          id: true,
          serviceType: { select: { name: true } },
        },
      });
      const nameById = Object.fromEntries(
        rows.map((r) => [r.id, r.serviceType?.name ?? '']),
      );
      out.serviceLabels = details.serviceIds
        .map((id) => nameById[id] ?? '')
        .filter((s) => s.length > 0);
    }
    return out;
  }

  /** Copies top-level Book catalog fields into `bookingDetails` before label enrichment. */
  private mergeAdminCatalogIntoDetails(
    details: SanitizedInquiryDetails | undefined,
    refs: {
      eventTypeId?: string | null;
      occasionTypeId?: string | null;
      guestCount?: number | null;
    },
  ): SanitizedInquiryDetails {
    const out: SanitizedInquiryDetails = { ...(details ?? {}) };
    const eventTypeId = refs.eventTypeId?.trim();
    if (eventTypeId) out.eventTypeId = eventTypeId;
    const occasionTypeId = refs.occasionTypeId?.trim();
    if (occasionTypeId) out.occasionTypeId = occasionTypeId;
    if (
      refs.guestCount != null &&
      Number.isFinite(refs.guestCount) &&
      refs.guestCount > 0
    ) {
      out.guestCount = Math.round(refs.guestCount);
    }
    return out;
  }

  /** Multi-service Book flow: `bookingDetails.serviceIds[0]` must match top-level `serviceId`. */
  private async assertAdminBookingServiceOrder(
    primaryServiceId: string,
    details: SanitizedInquiryDetails | undefined,
  ): Promise<void> {
    if (!details?.serviceIds?.length) return;
    if (details.serviceIds[0] !== primaryServiceId) {
      throw new BadRequestException(
        'serviceId must match the first id in bookingDetails.serviceIds.',
      );
    }
    const rows = await this.prisma.service.findMany({
      where: { id: { in: details.serviceIds } },
      select: { id: true },
    });
    if (rows.length !== details.serviceIds.length) {
      throw new BadRequestException(
        'One or more bookingDetails.serviceIds are not valid services.',
      );
    }
  }

  private bookingWindowFromEvent(
    eventDate: Date,
    bookingDetails: unknown,
    tz: string,
  ): { dateISO: string; startMinutes: number; endMinutes: number } {
    const wall = zonedWallClock(eventDate, tz);
    let startMinutes = wall.minutesSinceMidnight;
    let endMinutes = wall.minutesSinceMidnight;

    if (bookingDetails && typeof bookingDetails === 'object') {
      const parsed = sanitizeInquiryDetails(bookingDetails);
      if (
        parsed?.eventTimeStart &&
        /^\d{2}:\d{2}$/.test(parsed.eventTimeStart)
      ) {
        startMinutes = parseHHMM(parsed.eventTimeStart, 'eventTimeStart');
      }
      if (parsed?.eventTimeEnd && /^\d{2}:\d{2}$/.test(parsed.eventTimeEnd)) {
        endMinutes = parseHHMM(parsed.eventTimeEnd, 'eventTimeEnd');
      }
    }
    if (endMinutes < startMinutes) {
      endMinutes = startMinutes;
    }
    return { dateISO: wall.dateISO, startMinutes, endMinutes };
  }

  private rangesOverlap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number,
  ): boolean {
    return aStart <= bEnd && bStart <= aEnd;
  }

  private validateGuestVsUser(dto: {
    userId?: string;
    guestFullName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }): void {
    if (dto.userId) {
      if (dto.guestFullName || dto.guestEmail || dto.guestPhone) {
        throw new BadRequestException(
          'Do not send guest fields when userId is set.',
        );
      }
      return;
    }
    if (
      !dto.guestFullName?.trim() ||
      !dto.guestEmail?.trim() ||
      !dto.guestPhone?.trim()
    ) {
      throw new BadRequestException(
        'guestFullName, guestEmail and guestPhone are required without userId.',
      );
    }
  }

  private validateBookingTimeRange(details?: SanitizedInquiryDetails): void {
    if (!details) return;
    const start = details.eventTimeStart?.trim();
    const end = details.eventTimeEnd?.trim();
    if (!start && !end) return;
    if (!start || !end) {
      throw new BadRequestException(
        'bookingDetails must include eventTimeStart and eventTimeEnd together.',
      );
    }
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      throw new BadRequestException(
        'bookingDetails.eventTimeStart/eventTimeEnd must be HH:mm.',
      );
    }
    const startM = parseHHMM(start, 'eventTimeStart');
    const endM = parseHHMM(end, 'eventTimeEnd');
    if (endM <= startM) {
      throw new BadRequestException(
        'bookingDetails.eventTimeEnd must be after eventTimeStart.',
      );
    }
  }

  private async assertNoDuplicateSlot(
    eventDate: Date,
    bookingDetails?: unknown,
    excludeId?: string,
  ): Promise<void> {
    const tz = this.availability.bookingTimeZone();
    const incoming = this.bookingWindowFromEvent(eventDate, bookingDetails, tz);
    const dayStart = utcInstantForWallClock(incoming.dateISO, 0, tz);
    const dayEnd = utcInstantForWallClock(incoming.dateISO, 23 * 60 + 59, tz);

    const slots = await this.prisma.booking.findMany({
      where: {
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true, eventDate: true, bookingDetails: true },
    });

    for (const row of slots) {
      const existing = this.bookingWindowFromEvent(
        row.eventDate,
        row.bookingDetails,
        tz,
      );
      if (existing.dateISO !== incoming.dateISO) continue;
      if (
        this.rangesOverlap(
          incoming.startMinutes,
          incoming.endMinutes,
          existing.startMinutes,
          existing.endMinutes,
        )
      ) {
        throw new BadRequestException(
          'Ya existe una reserva confirmada en ese horario.',
        );
      }
    }
  }

  async getPublicOccupiedByDate(dateISO: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const tz = this.availability.bookingTimeZone();
    const dayStart = utcInstantForWallClock(dateISO, 0, tz);
    const dayEnd = utcInstantForWallClock(dateISO, 23 * 60 + 59, tz);
    const bookings = await this.prisma.booking.findMany({
      where: {
        eventDate: { gte: dayStart, lte: dayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      select: { eventDate: true, bookingDetails: true },
    });
    const occupied = bookings
      .map((b) =>
        this.bookingWindowFromEvent(b.eventDate, b.bookingDetails, tz),
      )
      .filter((w) => w.dateISO === dateISO)
      .map((w) => ({ startMinutes: w.startMinutes, endMinutes: w.endMinutes }));
    return { date: dateISO, occupied };
  }

  private async validateCatalogRefs(dto: {
    serviceId: string;
    eventTypeId?: string | null;
    occasionTypeId?: string | null;
    eventId?: string | null;
  }): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) throw new BadRequestException('Invalid serviceId.');
    if (dto.eventTypeId) {
      const row = await this.prisma.eventType.findUnique({
        where: { id: dto.eventTypeId },
      });
      if (!row) throw new BadRequestException('Invalid eventTypeId.');
    }
    if (dto.occasionTypeId) {
      const row = await this.prisma.occasionType.findUnique({
        where: { id: dto.occasionTypeId },
      });
      if (!row) throw new BadRequestException('Invalid occasionTypeId.');
    }
    if (dto.eventId) {
      const ev = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
      });
      if (!ev) throw new BadRequestException('Invalid eventId.');
      if (dto.eventTypeId && ev.eventTypeId !== dto.eventTypeId) {
        throw new BadRequestException(
          'eventId does not belong to eventTypeId.',
        );
      }
    }
  }

  async createAdminBooking(adminUserId: string, dto: CreateAdminBookingDto) {
    this.validateGuestVsUser(dto);
    await this.validateCatalogRefs(dto);

    if (dto.userId) {
      const u = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!u) throw new BadRequestException('Invalid userId.');
    }

    if (dto.contactRequestId) {
      const contact = await this.prisma.contactRequest.findUnique({
        where: { id: dto.contactRequestId },
      });
      if (!contact) throw new BadRequestException('Invalid contactRequestId.');
      const existingForContact = await this.prisma.booking.findFirst({
        where: { contactRequestId: dto.contactRequestId },
        select: { id: true },
      });
      if (existingForContact) {
        throw new BadRequestException(
          'This request already has a calendar booking.',
        );
      }
    }

    const sanitizedDetails = dto.bookingDetails
      ? sanitizeInquiryDetails(dto.bookingDetails)
      : undefined;
    const detailsForEnrich = this.mergeAdminCatalogIntoDetails(
      sanitizedDetails,
      {
        eventTypeId: dto.eventTypeId ?? null,
        occasionTypeId: dto.occasionTypeId ?? null,
        guestCount: dto.guestCount ?? null,
      },
    );
    const hasDetails = Object.keys(detailsForEnrich).length > 0;
    this.validateBookingTimeRange(hasDetails ? detailsForEnrich : undefined);
    await this.assertAdminBookingServiceOrder(
      dto.serviceId,
      hasDetails ? detailsForEnrich : undefined,
    );
    const enriched = hasDetails
      ? await this.enrichBookingDetails(detailsForEnrich)
      : undefined;

    const eventDate = new Date(dto.eventDate);
    if (Number.isNaN(eventDate.getTime())) {
      throw new BadRequestException('Invalid eventDate.');
    }

    await this.availability.assertDateTimeAllowed(eventDate);
    await this.assertNoDuplicateSlot(eventDate, enriched);

    const bookingSource =
      dto.source === BookingSource.ADMIN_FROM_CONTACT
        ? BookingSource.ADMIN_FROM_CONTACT
        : BookingSource.ADMIN_PHONE;

    const created = await this.prisma.booking.create({
      data: {
        serviceId: dto.serviceId,
        eventTypeId: dto.eventTypeId ?? null,
        occasionTypeId: dto.occasionTypeId ?? null,
        eventId: dto.eventId ?? null,
        eventDate,
        location: dto.location.trim(),
        guestCount: dto.guestCount ?? null,
        notes: dto.notes?.trim() || null,
        status: dto.status ?? BookingStatus.PENDING,
        bookingDetails:
          enriched === undefined
            ? undefined
            : (enriched as unknown as Prisma.InputJsonValue),
        source: bookingSource,
        createdByAdminId: adminUserId,
        contactRequestId: dto.contactRequestId ?? null,
        userId: dto.userId ?? null,
        guestFullName: dto.userId ? null : (dto.guestFullName?.trim() ?? null),
        guestEmail: dto.userId
          ? null
          : (dto.guestEmail?.trim().toLowerCase() ?? null),
        guestPhone: dto.userId ? null : (dto.guestPhone?.trim() ?? null),
      },
      include: bookingInclude,
    });

    await this.sendBookingCreatedConfirmation(created);

    return created;
  }

  /**
   * Materializes a confirmed calendar booking from a public booking-inquiry contact row.
   * Returns null when required catalog/guest fields are missing (contact stays inbox-only).
   */
  /** Sends booking confirmation email; safe to call after a transaction commits. */
  async notifyBookingCreated(booking: BookingWithRelations): Promise<void> {
    await this.sendBookingCreatedConfirmation(booking);
  }

  /**
   * Validates catalog/availability and builds insert payload (run outside Prisma transactions).
   */
  async preparePublicBookingInquiry(
    dto: CreateContactDto,
    enriched: SanitizedInquiryDetails,
    logContextId = 'pending',
  ): Promise<PublicBookingInquiryPrepared | null> {
    const phone = dto.phone?.trim();
    const location = dto.location?.trim();
    const guestFullName = dto.fullName.trim();
    const guestEmail = dto.email.trim().toLowerCase();
    if (!phone || !location || !dto.eventDate?.trim()) {
      this.logger.warn(
        `Public inquiry ${logContextId}: booking skipped (phone, location, or eventDate missing).`,
      );
      return null;
    }

    const serviceId = await resolvePrimaryServiceIdForInquiry(
      this.prisma,
      enriched,
      dto.serviceType,
    );
    if (!serviceId) {
      this.logger.warn(
        `Public inquiry ${logContextId}: booking skipped (no catalog service resolved).`,
      );
      return null;
    }

    const detailsAligned = bookingDetailsForPublicInquiry(enriched, serviceId);
    this.validateBookingTimeRange(detailsAligned);

    const tz = this.availability.bookingTimeZone();
    let minuteOfDay = 12 * 60;
    if (
      detailsAligned.eventTimeStart &&
      /^\d{2}:\d{2}$/.test(detailsAligned.eventTimeStart.trim())
    ) {
      minuteOfDay = parseHHMM(
        detailsAligned.eventTimeStart.trim(),
        'eventTimeStart',
      );
    }
    const eventInstant = utcInstantForWallClock(
      dto.eventDate.trim(),
      minuteOfDay,
      tz,
    );
    if (Number.isNaN(eventInstant.getTime())) {
      this.logger.warn(
        `Public inquiry ${logContextId}: booking skipped (invalid event date/time).`,
      );
      return null;
    }

    await this.availability.assertDateTimeAllowed(eventInstant);
    await this.assertNoDuplicateSlot(eventInstant, detailsAligned);

    const detailsEnriched = await this.enrichBookingDetails(detailsAligned);

    const eventTypeId = trimUuidField(detailsAligned.eventTypeId);
    const occasionTypeId = trimUuidField(detailsAligned.occasionTypeId);
    const eventId = trimUuidField(detailsAligned.eventId);

    let guestCount: number | null = null;
    if (
      detailsAligned.guestCount !== undefined &&
      detailsAligned.guestCount > 0
    ) {
      guestCount = detailsAligned.guestCount;
    }

    const notes = extractClientCommentFromContactMessage(dto.message);

    return {
      serviceId,
      eventTypeId: eventTypeId ?? null,
      occasionTypeId: occasionTypeId ?? null,
      eventId: eventId ?? null,
      eventDate: eventInstant,
      location,
      guestCount,
      notes: notes || null,
      bookingDetails: detailsEnriched as unknown as Prisma.InputJsonValue,
      guestFullName,
      guestEmail,
      guestPhone: phone,
    };
  }

  /** Inserts a prepared public-inquiry booking (keep inside a short transaction). */
  async insertPublicBookingInquiry(
    contactRequestId: string,
    prepared: PublicBookingInquiryPrepared,
    options?: CreateFromPublicBookingInquiryOptions,
  ): Promise<BookingWithRelations> {
    const db = options?.tx ?? this.prisma;
    const created = await db.booking.create({
      data: {
        serviceId: prepared.serviceId,
        eventTypeId: prepared.eventTypeId,
        occasionTypeId: prepared.occasionTypeId,
        eventId: prepared.eventId,
        eventDate: prepared.eventDate,
        location: prepared.location,
        guestCount: prepared.guestCount,
        notes: prepared.notes,
        status: BookingStatus.PENDING,
        bookingDetails: prepared.bookingDetails,
        source: BookingSource.CLIENT_REGISTERED,
        contactRequestId,
        guestFullName: prepared.guestFullName,
        guestEmail: prepared.guestEmail,
        guestPhone: prepared.guestPhone,
      },
      include: bookingInclude,
    });

    if (!options?.skipConfirmationEmail) {
      await this.sendBookingCreatedConfirmation(created);
    }
    this.logger.log(
      `Booking ${created.id} created from public inquiry ${contactRequestId}`,
    );
    return created;
  }

  async createFromPublicBookingInquiry(
    contactRequestId: string,
    dto: CreateContactDto,
    enriched: SanitizedInquiryDetails,
    options?: CreateFromPublicBookingInquiryOptions,
  ): Promise<BookingWithRelations | null> {
    const prepared = await this.preparePublicBookingInquiry(
      dto,
      enriched,
      contactRequestId,
    );
    if (!prepared) return null;
    return this.insertPublicBookingInquiry(contactRequestId, prepared, options);
  }

  /**
   * Sends guest/client confirmation email (MailerSend). Never throws; logs on failure.
   */
  private async sendBookingCreatedConfirmation(
    booking: BookingWithRelations,
  ): Promise<void> {
    try {
      const toEmail =
        booking.user?.email?.trim().toLowerCase() ??
        booking.guestEmail?.trim().toLowerCase();
      if (!toEmail) {
        this.logger.warn(
          `Booking ${booking.id}: confirmation email skipped (no recipient address).`,
        );
        return;
      }

      const recipientName =
        booking.user?.fullName?.trim() ||
        booking.guestFullName?.trim() ||
        'Guest';

      let details: SanitizedInquiryDetails | undefined;
      if (
        booking.bookingDetails !== null &&
        booking.bookingDetails !== undefined
      ) {
        try {
          details = sanitizeInquiryDetails(booking.bookingDetails);
        } catch {
          details = undefined;
        }
      }
      const times = timesFromDetails(details);

      const multiLabels = details?.serviceLabels?.filter(
        (s) => typeof s === 'string' && s.trim().length > 0,
      );
      const serviceLabel = multiLabels?.length
        ? multiLabels.join(', ')
        : (booking.service.serviceType?.name ?? 'Service');
      const serviceHeading =
        multiLabels && multiLabels.length > 1 ? 'Services' : 'Service';

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const branding = this.emailBrandingForTemplates();
      const frontendBaseUrl = branding.siteBaseUrl;

      const templateInput: BookingConfirmationTemplateInput = {
        recipientName,
        timeZone: this.availability.bookingTimeZone(),
        eventDate: booking.eventDate,
        eventTimeStart: times.start,
        eventTimeEnd: times.end,
        location: booking.location,
        serviceLabel,
        serviceHeading,
        eventTypeLabel: booking.eventType?.name ?? undefined,
        occasionLabel: booking.occasionType?.name ?? undefined,
        guestCount: booking.guestCount,
        appPublicName,
        frontendBaseUrl,
        branding,
        emailVariant:
          booking.source === BookingSource.ADMIN_FROM_CONTACT
            ? 'inbox_from_contact'
            : 'default',
      };

      const subject = buildBookingConfirmationSubject(appPublicName);
      const html = buildBookingConfirmationHtml(templateInput);
      const text = buildBookingConfirmationText(templateInput);

      const { ok: sent } = await this.mail.sendTransactional({
        to: toEmail,
        toName: recipientName,
        subject,
        html,
        text,
      });

      if (sent) {
        this.logger.log(
          `Booking confirmation email sent for booking ${booking.id} to ${toEmail}`,
        );
        await this.adminActivityNotify.notifyCustomerActivity({
          kind: 'BOOKING_CONFIRMED',
          customerName: recipientName,
          customerEmail: toEmail,
          reference: booking.id.slice(0, 8).toUpperCase(),
          contextLabel: this.bookingContextLabel(booking),
          detailsLines: this.bookingEventDateLabel(booking)
            ? [`Event date: ${this.bookingEventDateLabel(booking)}`]
            : undefined,
        });
      }
    } catch (err) {
      this.logger.error(
        `Booking ${booking.id}: confirmation email error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async findAllAdmin(query: AdminBookingQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const where: Prisma.BookingWhereInput = {};
    if (query.status) {
      where.status = query.status;
    } else if (query.activeOnly) {
      where.status = {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      };
    }
    if (query.source) where.source = query.source;
    if (query.from || query.to) {
      where.eventDate = {};
      if (query.from) where.eventDate.gte = new Date(query.from);
      if (query.to) where.eventDate.lte = new Date(query.to);
    }
    const [totalItems, items] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        orderBy: { eventDate: 'desc' },
        include: bookingInclude,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    return {
      items,
      meta: {
        page,
        perPage,
        totalItems,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    };
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingInclude,
    });
    if (!row) throw new NotFoundException('Booking not found.');
    return row;
  }

  async updateAdmin(id: string, dto: UpdateAdminBookingDto) {
    const existing = await this.findOneAdmin(id);

    const serviceId = dto.serviceId ?? existing.serviceId;
    const eventTypeId =
      dto.eventTypeId !== undefined ? dto.eventTypeId : existing.eventTypeId;
    const occasionTypeId =
      dto.occasionTypeId !== undefined
        ? dto.occasionTypeId
        : existing.occasionTypeId;
    const eventId = dto.eventId !== undefined ? dto.eventId : existing.eventId;

    if (
      dto.serviceId !== undefined ||
      dto.eventTypeId !== undefined ||
      dto.occasionTypeId !== undefined ||
      dto.eventId !== undefined
    ) {
      await this.validateCatalogRefs({
        serviceId,
        eventTypeId,
        occasionTypeId,
        eventId,
      });
    }

    let mergedDetailsUnknown: unknown = existing.bookingDetails;
    const catalogFieldsChanged =
      dto.eventTypeId !== undefined ||
      dto.occasionTypeId !== undefined ||
      dto.guestCount !== undefined ||
      dto.serviceId !== undefined;

    if (dto.bookingDetails !== undefined || catalogFieldsChanged) {
      const prev =
        existing.bookingDetails &&
        typeof existing.bookingDetails === 'object' &&
        !Array.isArray(existing.bookingDetails)
          ? (existing.bookingDetails as Record<string, unknown>)
          : {};
      mergedDetailsUnknown =
        dto.bookingDetails !== undefined
          ? { ...prev, ...dto.bookingDetails }
          : prev;
    }

    let enrichedDetails: SanitizedInquiryDetails | undefined;
    if (dto.bookingDetails !== undefined || catalogFieldsChanged) {
      const sanitizedMerge = sanitizeInquiryDetails(mergedDetailsUnknown);
      if (!sanitizedMerge) {
        throw new BadRequestException('Invalid bookingDetails merge.');
      }
      const detailsForEnrich = this.mergeAdminCatalogIntoDetails(
        sanitizedMerge,
        {
          eventTypeId: eventTypeId ?? null,
          occasionTypeId: occasionTypeId ?? null,
          guestCount:
            dto.guestCount !== undefined ? dto.guestCount : existing.guestCount,
        },
      );
      this.validateBookingTimeRange(detailsForEnrich);
      await this.assertAdminBookingServiceOrder(serviceId, detailsForEnrich);
      enrichedDetails = await this.enrichBookingDetails(detailsForEnrich);
    }

    let eventDate = existing.eventDate;
    if (dto.eventDate !== undefined) {
      eventDate = new Date(dto.eventDate);
      if (Number.isNaN(eventDate.getTime())) {
        throw new BadRequestException('Invalid eventDate.');
      }
      await this.availability.assertDateTimeAllowed(eventDate);
      await this.assertNoDuplicateSlot(
        eventDate,
        enrichedDetails ?? mergedDetailsUnknown,
        id,
      );
    } else if (dto.bookingDetails !== undefined && enrichedDetails) {
      await this.assertNoDuplicateSlot(existing.eventDate, enrichedDetails, id);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        ...(dto.serviceId !== undefined ? { serviceId: dto.serviceId } : {}),
        ...(dto.eventTypeId !== undefined
          ? { eventTypeId: dto.eventTypeId }
          : {}),
        ...(dto.occasionTypeId !== undefined
          ? { occasionTypeId: dto.occasionTypeId }
          : {}),
        ...(dto.eventId !== undefined ? { eventId: dto.eventId } : {}),
        ...(dto.eventDate !== undefined ? { eventDate } : {}),
        ...(dto.location !== undefined
          ? { location: dto.location.trim() }
          : {}),
        ...(dto.guestCount !== undefined ? { guestCount: dto.guestCount } : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(enrichedDetails !== undefined
          ? {
              bookingDetails: enrichedDetails,
            }
          : {}),
      },
      include: bookingInclude,
    });

    if (dto.status === BookingStatus.CANCELLED && existing.contactRequestId) {
      await this.cancelLinkedContactRequest(existing.contactRequestId);
    }

    if (
      dto.status === BookingStatus.CANCELLED &&
      existing.status !== BookingStatus.CANCELLED
    ) {
      await this.cancelPendingBookingPayments(updated.id);
      await this.notifyAdminBookingCancelled(updated);
    }

    return updated;
  }

  async removeAdmin(id: string, options?: { purgeContact?: boolean }) {
    const existing = await this.findOneAdmin(id);
    const contactRequestId = existing.contactRequestId;

    await this.prisma.$transaction(async (tx) => {
      if (contactRequestId) {
        await tx.contactRequest.update({
          where: { id: contactRequestId },
          data: {
            status: ContactRequestStatus.CANCELLED,
            isRead: true,
          },
        });
      }
      await tx.booking.delete({ where: { id } });
      if (options?.purgeContact && contactRequestId) {
        await tx.contactRequest.delete({ where: { id: contactRequestId } });
      }
    });

    return { ok: true };
  }

  async createBookingQuote(
    adminUserId: string,
    bookingId: string,
    dto: CreateBookingQuoteDto,
  ) {
    const booking = await this.findOneAdmin(bookingId);
    const toEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) {
      throw new BadRequestException('Booking has no customer email.');
    }

    const currency = (dto.currency?.trim().toLowerCase() ?? 'usd') || 'usd';
    if (currency !== 'usd') {
      throw new BadRequestException('Only USD is supported for this flow.');
    }
    const total = Number(dto.totalAmount);
    if (!Number.isFinite(total) || total <= 0) {
      throw new BadRequestException('Invalid total amount.');
    }

    let deposit = 0;
    let balance = 0;
    if (dto.paymentModel === BookingQuotePaymentModel.DEPOSIT) {
      deposit = Number(dto.depositAmount ?? 0);
      if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= total) {
        throw new BadRequestException(
          'Deposit amount must be > 0 and < total amount.',
        );
      }
      balance = Number((total - deposit).toFixed(2));
    }

    const rawToken = randomBytes(24).toString('hex');
    const tokenHash = this.hashQuoteToken(rawToken);
    const tokenExpiresAt = new Date(
      Date.now() + QUOTE_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.cancelPendingBookingPayments(booking.id);

    const quote = await this.prisma.bookingQuote.create({
      data: {
        bookingId: booking.id,
        paymentModel: dto.paymentModel,
        totalAmount: total,
        depositAmount:
          dto.paymentModel === BookingQuotePaymentModel.DEPOSIT
            ? deposit
            : null,
        balanceAmount:
          dto.paymentModel === BookingQuotePaymentModel.DEPOSIT
            ? balance
            : null,
        currency,
        tokenHash,
        tokenExpiresAt,
      },
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.PENDING,
        quoteModel: dto.paymentModel,
        quoteTotalAmount: total,
        quoteDepositAmount:
          dto.paymentModel === BookingQuotePaymentModel.DEPOSIT
            ? deposit
            : null,
        quoteBalanceAmount:
          dto.paymentModel === BookingQuotePaymentModel.DEPOSIT
            ? balance
            : null,
        quoteCurrency: currency,
        quoteSentAt: new Date(),
        quoteAcceptedAt: null,
        quoteRejectedAt: null,
      },
    });

    const stage =
      dto.paymentModel === BookingQuotePaymentModel.DEPOSIT
        ? BookingPaymentStage.DEPOSIT
        : BookingPaymentStage.FULL;
    const payAmount = stage === BookingPaymentStage.FULL ? total : deposit;
    const payment = await this.createBookingStripePayment({
      bookingId: booking.id,
      quoteId: quote.id,
      stage,
      amount: payAmount,
      currency,
      customerEmail: toEmail,
      customerName: booking.user?.fullName ?? booking.guestFullName ?? 'Client',
      adminUserId,
    });

    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const payUrl = this.buildQuotePayUrl(rawToken);
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const customerName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    const { ok: quoteEmailSent } = await this.mail.sendTransactional({
      to: toEmail,
      toName: customerName,
      subject: buildBookingQuoteSubject(appPublicName),
      html: buildBookingQuoteHtml({
        recipientName: customerName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        totalAmountUsd: this.usd(total),
        depositAmountUsd: deposit > 0 ? this.usd(deposit) : undefined,
        balanceAmountUsd: balance > 0 ? this.usd(balance) : undefined,
        payUrl,
      }),
      text: buildBookingQuoteText({
        recipientName: customerName,
        appPublicName,
        frontendBaseUrl,
        bookingReference: bookingRef,
        totalAmountUsd: this.usd(total),
        depositAmountUsd: deposit > 0 ? this.usd(deposit) : undefined,
        balanceAmountUsd: balance > 0 ? this.usd(balance) : undefined,
        payUrl,
      }),
    });
    if (quoteEmailSent) {
      await this.adminActivityNotify.notifyCustomerActivity({
        kind: 'BOOKING_QUOTE_SENT',
        customerName,
        customerEmail: toEmail,
        reference: bookingRef,
        contextLabel: this.bookingContextLabel(booking),
        amountUsd: this.usd(payAmount),
      });
    }

    return {
      message: 'Payment link sent successfully.',
      quoteId: quote.id,
      paymentId: payment.id,
      checkoutSessionId: payment.stripeCheckoutSessionId,
      quoteExpiresAt: tokenExpiresAt.toISOString(),
    };
  }

  async sendBookingBalanceLink(
    adminUserId: string,
    bookingId: string,
    dto: SendBookingBalanceLinkDto,
  ) {
    const booking = await this.findOneAdmin(bookingId);
    if (
      !booking.quoteBalanceAmount ||
      Number(booking.quoteBalanceAmount) <= 0
    ) {
      throw new BadRequestException('Booking has no pending balance.');
    }
    if (!booking.depositPaidAt) {
      throw new BadRequestException(
        'Deposit must be paid before sending balance link.',
      );
    }

    const activeQuote = await this.prisma.bookingQuote.findFirst({
      where: {
        bookingId,
        status: { in: [BookingQuoteStatus.SENT, BookingQuoteStatus.ACCEPTED] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!activeQuote) {
      throw new NotFoundException('Active quote not found.');
    }
    const customerEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!customerEmail)
      throw new BadRequestException('Missing customer email.');
    const currency = (dto.currency?.trim().toLowerCase() ?? 'usd') || 'usd';
    if (currency !== 'usd') {
      throw new BadRequestException('Only USD is supported.');
    }
    const balanceAmount = Number(booking.quoteBalanceAmount);
    const rawToken = randomBytes(24).toString('hex');
    await this.prisma.bookingQuote.update({
      where: { id: activeQuote.id },
      data: {
        tokenHash: this.hashQuoteToken(rawToken),
        tokenExpiresAt: new Date(
          Date.now() + QUOTE_TOKEN_TTL_HOURS * 60 * 60 * 1000,
        ),
      },
    });
    const payment = await this.createBookingStripePayment({
      bookingId,
      quoteId: activeQuote.id,
      stage: BookingPaymentStage.BALANCE,
      amount: balanceAmount,
      currency,
      customerEmail,
      customerName: booking.user?.fullName ?? booking.guestFullName ?? 'Client',
      adminUserId,
    });

    await this.prisma.bookingPayment.updateMany({
      where: {
        bookingId,
        stage: BookingPaymentStage.BALANCE,
        status: BookingPaymentStatus.PENDING,
        id: { not: payment.id },
      },
      data: { status: BookingPaymentStatus.CANCELLED },
    });

    const payUrl = this.buildQuotePayUrl(rawToken);
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const customerName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    const { ok: balanceEmailSent } = await this.mail.sendTransactional({
      to: customerEmail,
      toName: customerName,
      subject: buildBookingBalanceLinkSubject(appPublicName),
      html: buildBookingBalanceLinkHtml({
        recipientName: customerName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        totalAmountUsd: this.usd(balanceAmount),
        payUrl,
      }),
      text: buildBookingBalanceLinkText({
        recipientName: customerName,
        appPublicName,
        frontendBaseUrl,
        bookingReference: bookingRef,
        totalAmountUsd: this.usd(balanceAmount),
        payUrl,
      }),
    });
    if (balanceEmailSent) {
      await this.adminActivityNotify.notifyCustomerActivity({
        kind: 'BOOKING_BALANCE_LINK_SENT',
        customerName,
        customerEmail,
        reference: bookingRef,
        contextLabel: this.bookingContextLabel(booking),
        amountUsd: this.usd(balanceAmount),
      });
    }

    return {
      message: 'Balance payment link sent successfully.',
      paymentId: payment.id,
      payUrl,
    };
  }

  resolveQuotePayUrl(token: string): string {
    const frontendBase = this.stripeService.frontendUrl().replace(/\/$/, '');
    return `${frontendBase}/pay/quote?token=${encodeURIComponent(token)}`;
  }

  async resolveQuoteCheckoutClientSecret(token: string): Promise<string> {
    const quote = await this.findActiveQuoteByToken(token);
    const booking = await this.prisma.booking.findUnique({
      where: { id: quote.bookingId },
      include: { user: true },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    let payment = await this.prisma.bookingPayment.findFirst({
      where: {
        quoteId: quote.id,
        status: BookingPaymentStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) {
      throw new NotFoundException('No pending payment for this quote.');
    }

    const session = await this.stripeService.client.checkout.sessions.retrieve(
      payment.stripeCheckoutSessionId,
    );

    if (session.status === 'expired' || session.status === 'complete') {
      if (session.status === 'complete' && session.payment_status === 'paid') {
        throw new BadRequestException(
          'This payment has already been completed.',
        );
      }
      if (session.status === 'expired') {
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { status: BookingPaymentStatus.EXPIRED },
        });
        const customerEmail =
          booking.user?.email?.trim().toLowerCase() ??
          booking.guestEmail?.trim().toLowerCase();
        if (!customerEmail) {
          throw new BadRequestException('Missing customer email.');
        }
        payment = await this.createBookingStripePayment({
          bookingId: booking.id,
          quoteId: quote.id,
          stage: payment.stage,
          amount: Number(payment.expectedAmount),
          currency: payment.currency,
          customerEmail,
          customerName:
            booking.user?.fullName ?? booking.guestFullName ?? 'Client',
          adminUserId: 'quote-reissue',
        });
      }
    }

    const refreshed =
      await this.stripeService.client.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId,
      );
    if (!refreshed.client_secret) {
      throw new BadRequestException('Stripe checkout is not available.');
    }
    return refreshed.client_secret;
  }

  async getQuotePaymentSessionStatus(sessionId: string) {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { booking: { include: { user: true } } },
    });
    if (!payment) {
      throw new NotFoundException('Payment session not found.');
    }
    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';
    let stripeSession: Awaited<
      ReturnType<typeof this.stripeService.client.checkout.sessions.retrieve>
    > | null = null;
    try {
      stripeSession =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);
      if (stripeSession.status === 'complete') stripeStatus = 'complete';
      else if (stripeSession.status === 'expired') stripeStatus = 'expired';
    } catch {
      stripeStatus = 'expired';
    }

    if (
      stripeSession?.status === 'complete' &&
      stripeSession.payment_status === 'paid' &&
      payment.status === BookingPaymentStatus.PENDING
    ) {
      try {
        await this.markBookingPaymentPaid(
          'return-page-reconcile',
          this.parseStripeCheckoutSession(stripeSession),
        );
      } catch (err) {
        this.logger.warn(
          `booking-reconcile-on-status-failed session=${sessionId} reason=${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    const refreshed = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: { booking: { include: { user: true } } },
    });
    const current = refreshed ?? payment;
    const booking = current.booking;
    return {
      stripeStatus,
      paymentStatus: current.status,
      stage: current.stage,
      amount: Number(current.expectedAmount),
      currency: current.currency,
      customerName: maskCustomerName(
        booking.user?.fullName ?? booking.guestFullName ?? 'Client',
      ),
      customerEmail:
        maskEmail(booking.user?.email ?? booking.guestEmail ?? '') ?? '',
    };
  }

  async handleBookingPaymentsWebhook(
    rawBody: Buffer,
    signature: string | string[] | undefined,
  ) {
    if (!signature || Array.isArray(signature)) {
      throw new BadRequestException('Missing stripe-signature header.');
    }
    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,
      signature,
      this.stripeService.webhookSecret,
    );
    return this.processStripeWebhookEvent(event);
  }

  async processStripeWebhookEvent(event: {
    id: string;
    type: string;
    data: { object: unknown };
  }): Promise<{ received: true; handled: boolean }> {
    const eventObj = this.parseStripeCheckoutSession(event.data.object);
    if (eventObj.metadata?.flow !== 'booking_quote') {
      return { received: true, handled: false };
    }
    if (event.type === 'checkout.session.completed') {
      await this.markBookingPaymentPaid(event.id, eventObj);
      return { received: true, handled: true };
    }
    if (event.type === 'checkout.session.expired') {
      const sessionId = eventObj.id?.trim();
      if (!sessionId) {
        throw new BadRequestException(
          'Invalid checkout.session.expired payload.',
        );
      }
      await this.markBookingPaymentExpired(sessionId);
      return { received: true, handled: true };
    }
    return { received: true, handled: false };
  }

  private async markBookingPaymentPaid(
    stripeEventId: string,
    session: StripeCheckoutSessionLite,
  ): Promise<void> {
    const sessionId = session.id;
    if (!sessionId) throw new BadRequestException('Missing session id.');
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        booking: {
          include: {
            user: true,
            eventType: true,
            service: { include: { serviceType: true } },
            event: { include: { eventType: true } },
          },
        },
        quote: true,
      },
    });
    if (!payment) throw new NotFoundException('Booking payment not found.');
    if (payment.status === BookingPaymentStatus.PAID) return;
    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Session payment_status is not paid.');
    }
    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(payment.expectedAmount) * 100),
      expectedCurrency: payment.currency,
      sessionLabel: sessionId,
    });
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const paidAt = new Date();
    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: {
        status: BookingPaymentStatus.PAID,
        paidAt,
        stripePaymentIntentId: paymentIntentId,
      },
    });
    if (payment.stage === BookingPaymentStage.DEPOSIT) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          depositPaidAt: paidAt,
          status: BookingStatus.PENDING,
        },
      });
      if (!payment.customerEmailSentAt) {
        await this.sendDepositPaidEmail(
          payment.bookingId,
          Number(payment.expectedAmount),
        );
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { customerEmailSentAt: new Date() },
        });
      }
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'DEPOSIT_PAID',
        flow: 'BOOKING_QUOTE',
        customerName:
          payment.booking.user?.fullName ??
          payment.booking.guestFullName ??
          'Client',
        customerEmail:
          payment.booking.user?.email ?? payment.booking.guestEmail ?? '',
        amount: Number(payment.expectedAmount),
        currency: payment.currency,
        contextLabel: this.bookingContextLabel(payment.booking),
        reference: payment.bookingId.slice(0, 8).toUpperCase(),
        stage: payment.stage,
      });
    } else {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          ...(payment.stage === BookingPaymentStage.FULL
            ? { totalAmount: payment.expectedAmount }
            : {
                balancePaidAt: paidAt,
                totalAmount: payment.quote.totalAmount,
              }),
        },
      });
      if (!payment.customerEmailSentAt) {
        await this.sendFullyPaidEmail(
          payment.bookingId,
          Number(payment.expectedAmount),
        );
        await this.prisma.bookingPayment.update({
          where: { id: payment.id },
          data: { customerEmailSentAt: new Date() },
        });
      }
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'PAID',
        flow: 'BOOKING_QUOTE',
        customerName:
          payment.booking.user?.fullName ??
          payment.booking.guestFullName ??
          'Client',
        customerEmail:
          payment.booking.user?.email ?? payment.booking.guestEmail ?? '',
        amount: Number(payment.expectedAmount),
        currency: payment.currency,
        contextLabel: this.bookingContextLabel(payment.booking),
        reference: payment.bookingId.slice(0, 8).toUpperCase(),
        stage: payment.stage,
      });
    }
    this.logger.log(
      `booking-payment-paid bookingId=${payment.bookingId} paymentId=${payment.id} stage=${payment.stage} eventId=${stripeEventId}`,
    );
  }

  private async markBookingPaymentExpired(sessionId: string): Promise<void> {
    const payment = await this.prisma.bookingPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        booking: {
          include: {
            user: true,
            eventType: true,
            service: { include: { serviceType: true } },
            event: { include: { eventType: true } },
          },
        },
      },
    });
    if (!payment || payment.status !== BookingPaymentStatus.PENDING) return;
    await this.prisma.bookingPayment.update({
      where: { id: payment.id },
      data: { status: BookingPaymentStatus.EXPIRED },
    });
    const booking = payment.booking;
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',
      flow: 'BOOKING_QUOTE',
      customerName: booking.user?.fullName ?? booking.guestFullName ?? 'Client',
      customerEmail: booking.user?.email ?? booking.guestEmail ?? '',
      amount: Number(payment.expectedAmount),
      currency: payment.currency,
      contextLabel: this.bookingContextLabel(booking),
      reference: booking.id.slice(0, 8).toUpperCase(),
      stage: payment.stage,
    });
  }

  private async createBookingStripePayment(args: {
    bookingId: string;
    quoteId: string;
    stage: BookingPaymentStage;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    adminUserId: string;
  }) {
    const amountCents = Math.round(Number(args.amount) * 100);
    if (amountCents < 50) throw new BadRequestException('Invalid amount.');
    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const returnUrl = `${this.stripeService.frontendUrl()}/pay/quote/return?session_id={CHECKOUT_SESSION_ID}`;
    const sessionParams = {
      ui_mode: 'embedded_page' as const,
      mode: 'payment' as const,
      customer_email: args.customerEmail,
      wallet_options: STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS,
      ...stripeAutomaticTaxParams(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: args.currency,
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name:
                args.stage === BookingPaymentStage.FULL
                  ? 'Booking full payment'
                  : args.stage === BookingPaymentStage.DEPOSIT
                    ? 'Booking deposit payment'
                    : 'Booking balance payment',
              description: `Booking ${args.bookingId.slice(0, 8).toUpperCase()}`,
            }),
          },
        },
      ],
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      return_url: returnUrl,
      metadata: {
        flow: 'booking_quote',
        bookingId: args.bookingId,
        quoteId: args.quoteId,
        stage: args.stage,
        adminUserId: args.adminUserId,
      },
    };
    const session =
      await this.stripeService.client.checkout.sessions.create(sessionParams);
    if (!session.client_secret) {
      throw new BadRequestException('Could not start checkout.');
    }
    const created = await this.prisma.bookingPayment.create({
      data: {
        bookingId: args.bookingId,
        quoteId: args.quoteId,
        stage: args.stage,
        expectedAmount: args.amount,
        currency: args.currency,
        stripeCheckoutSessionId: session.id,
        expiresAt,
      },
    });
    return created;
  }

  private async sendDepositPaidEmail(
    bookingId: string,
    amount: number,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) return;
    const toEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) return;
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const recipientName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    await this.mail.sendTransactional({
      to: toEmail,
      toName: recipientName,
      subject: buildBookingDepositPaidSubject(appPublicName),
      html: buildBookingDepositPaidHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.bookingEventDateLabel(booking),
      }),
      text: buildBookingDepositPaidText({
        appPublicName,
        recipientName,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.bookingEventDateLabel(booking),
      }),
    });
  }

  private async sendFullyPaidEmail(
    bookingId: string,
    amount: number,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
    if (!booking) return;
    const toEmail =
      booking.user?.email?.trim().toLowerCase() ??
      booking.guestEmail?.trim().toLowerCase();
    if (!toEmail) return;
    const appPublicName =
      this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
      'Shamell Entertainment';
    const branding = this.emailBrandingForTemplates();
    const frontendBaseUrl = branding.siteBaseUrl;
    const bookingRef = booking.id.slice(0, 8).toUpperCase();
    const recipientName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    await this.mail.sendTransactional({
      to: toEmail,
      toName: recipientName,
      subject: buildBookingFullyPaidSubject(appPublicName),
      html: buildBookingFullyPaidHtml({
        recipientName,
        appPublicName,
        frontendBaseUrl,
        branding,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.bookingEventDateLabel(booking),
      }),
      text: buildBookingFullyPaidText({
        appPublicName,
        recipientName,
        bookingReference: bookingRef,
        amountUsd: this.usd(amount),
        eventDateLabel: this.bookingEventDateLabel(booking),
      }),
    });
  }

  private bookingContextLabel(booking: {
    id: string;
    eventType?: { name: string } | null;
    service?: { serviceType?: { name: string } } | null;
  }): string {
    return (
      booking.eventType?.name ||
      booking.service?.serviceType?.name ||
      `Booking ${booking.id.slice(0, 8).toUpperCase()}`
    );
  }

  private bookingEventDateLabel(
    booking: Pick<BookingWithRelations, 'eventDate'>,
  ): string | undefined {
    if (!booking.eventDate) return undefined;
    return booking.eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private async cancelPendingBookingPayments(bookingId: string): Promise<void> {
    await this.prisma.bookingPayment.updateMany({
      where: { bookingId, status: BookingPaymentStatus.PENDING },
      data: { status: BookingPaymentStatus.CANCELLED },
    });
  }

  private async notifyAdminBookingCancelled(
    booking: BookingWithRelations,
  ): Promise<void> {
    const customerName =
      booking.user?.fullName ?? booking.guestFullName ?? 'Client';
    const customerEmail = booking.user?.email ?? booking.guestEmail ?? '';
    const amount = Number(booking.quoteTotalAmount ?? booking.totalAmount ?? 0);
    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'CANCELLED',
      flow: 'BOOKING_QUOTE',
      customerName,
      customerEmail,
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
      currency: booking.quoteCurrency ?? 'usd',
      contextLabel: this.bookingContextLabel(booking),
      reference: booking.id.slice(0, 8).toUpperCase(),
    });
  }

  private hashQuoteToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private async findActiveQuoteByToken(rawToken: string) {
    const tokenHash = this.hashQuoteToken(rawToken);
    const quote = await this.prisma.bookingQuote.findFirst({
      where: {
        tokenHash,
        status: { in: [BookingQuoteStatus.SENT, BookingQuoteStatus.ACCEPTED] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!quote) throw new NotFoundException('Quote not found.');
    if (quote.tokenExpiresAt.getTime() < Date.now()) {
      await this.prisma.bookingQuote.update({
        where: { id: quote.id },
        data: { status: BookingQuoteStatus.EXPIRED },
      });
      throw new BadRequestException('Quote has expired.');
    }
    return quote;
  }

  private usd(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private buildQuotePayUrl(token: string): string {
    const frontendBase = this.stripeService.frontendUrl().replace(/\/$/, '');
    return `${frontendBase}/pay/quote?token=${encodeURIComponent(token)}`;
  }

  private parseStripeCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid Stripe checkout session payload.');
    }
    return raw;
  }

  private async cancelLinkedContactRequest(
    contactRequestId: string,
  ): Promise<void> {
    await this.prisma.contactRequest.update({
      where: { id: contactRequestId },
      data: {
        status: ContactRequestStatus.CANCELLED,
        isRead: true,
      },
    });
  }
}

const UUID_FIELD =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function trimUuidField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return UUID_FIELD.test(t) ? t : undefined;
}

const CONTACT_MESSAGE_SEPARATOR = '\n\n---\n\n';

function extractClientCommentFromContactMessage(message: string): string {
  const i = message.indexOf(CONTACT_MESSAGE_SEPARATOR);
  if (i === -1) return message.trim();
  return message.slice(i + CONTACT_MESSAGE_SEPARATOR.length).trim();
}
