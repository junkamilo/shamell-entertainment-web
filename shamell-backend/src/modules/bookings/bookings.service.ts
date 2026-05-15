import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingSource,
  BookingStatus,
  ContactRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
import { MailService } from '../mail/mail.service';

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

export type CreateFromPublicBookingInquiryOptions = {
  tx?: PrismaTx;
  /** When true, caller sends confirmation after the surrounding transaction commits. */
  skipConfirmationEmail?: boolean;
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

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
        status: BookingStatus.CONFIRMED,
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
        status: BookingStatus.CONFIRMED,
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

    const detailsRaw = dto.bookingDetails
      ? sanitizeInquiryDetails(dto.bookingDetails)
      : undefined;
    this.validateBookingTimeRange(detailsRaw);
    await this.assertAdminBookingServiceOrder(dto.serviceId, detailsRaw);
    const enriched =
      detailsRaw && Object.keys(detailsRaw).length > 0
        ? await this.enrichBookingDetails(detailsRaw)
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

  async createFromPublicBookingInquiry(
    contactRequestId: string,
    dto: CreateContactDto,
    enriched: SanitizedInquiryDetails,
    options?: CreateFromPublicBookingInquiryOptions,
  ): Promise<BookingWithRelations | null> {
    const phone = dto.phone?.trim();
    const location = dto.location?.trim();
    const guestFullName = dto.fullName.trim();
    const guestEmail = dto.email.trim().toLowerCase();
    if (!phone || !location || !dto.eventDate?.trim()) {
      this.logger.warn(
        `Public inquiry ${contactRequestId}: booking skipped (phone, location, or eventDate missing).`,
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
        `Public inquiry ${contactRequestId}: booking skipped (no catalog service resolved).`,
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
        `Public inquiry ${contactRequestId}: booking skipped (invalid event date/time).`,
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
    if (detailsAligned.guestCount !== undefined && detailsAligned.guestCount > 0) {
      guestCount = detailsAligned.guestCount;
    }

    const notes = extractClientCommentFromContactMessage(dto.message);

    const db = options?.tx ?? this.prisma;
    const created = await db.booking.create({
      data: {
        serviceId,
        eventTypeId: eventTypeId ?? null,
        occasionTypeId: occasionTypeId ?? null,
        eventId: eventId ?? null,
        eventDate: eventInstant,
        location,
        guestCount,
        notes: notes || null,
        status: BookingStatus.CONFIRMED,
        bookingDetails: detailsEnriched as unknown as Prisma.InputJsonValue,
        source: BookingSource.CLIENT_REGISTERED,
        contactRequestId,
        guestFullName,
        guestEmail,
        guestPhone: phone,
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
      const serviceLabel =
        multiLabels?.length ?
          multiLabels.join(', ')
        : (booking.service.serviceType?.name ?? 'Service');
      const serviceHeading =
        multiLabels && multiLabels.length > 1 ? 'Services' : 'Service';

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const frontendRaw = this.config.get<string>('FRONTEND_URL')?.trim();
      const frontendBaseUrl = frontendRaw?.split(',')[0]?.trim();

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
    if (query.status) where.status = query.status;
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
    if (dto.bookingDetails !== undefined) {
      const prev =
        existing.bookingDetails &&
        typeof existing.bookingDetails === 'object' &&
        !Array.isArray(existing.bookingDetails)
          ? (existing.bookingDetails as Record<string, unknown>)
          : {};
      mergedDetailsUnknown = { ...prev, ...dto.bookingDetails };
    }

    let enrichedDetails: SanitizedInquiryDetails | undefined;
    if (dto.bookingDetails !== undefined) {
      const sanitizedMerge = sanitizeInquiryDetails(mergedDetailsUnknown);
      if (!sanitizedMerge) {
        throw new BadRequestException('Invalid bookingDetails merge.');
      }
      this.validateBookingTimeRange(sanitizedMerge);
      await this.assertAdminBookingServiceOrder(serviceId, sanitizedMerge);
      enrichedDetails = await this.enrichBookingDetails(sanitizedMerge);
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
      await this.assertNoDuplicateSlot(
        existing.eventDate,
        enrichedDetails,
        id,
      );
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
              bookingDetails: enrichedDetails as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
      include: bookingInclude,
    });

    if (
      dto.status === BookingStatus.CANCELLED &&
      existing.contactRequestId
    ) {
      await this.cancelLinkedContactRequest(existing.contactRequestId);
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
