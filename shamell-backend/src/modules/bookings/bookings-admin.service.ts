import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingPaymentStatus,
  BookingSource,
  BookingStatus,
  ContactRequestStatus,
  EventPublicSection,
  EventTypeCatalogChannel,
  Prisma,
} from '@prisma/client';
import { buildPaginationMeta } from '../../common/pagination/pagination.util';
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
} from '../booking-inquiry/contact-inquiry-details';
import type { AdminBookingQueryDto } from './dto/admin-booking-query.dto';
import type { AdminCalendarQueryDto } from './dto/admin-calendar-query.dto';
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
import {
  adminListInclude,
  calendarInclude,
  type BookingWithRelations,
} from './booking-includes';
import {
  resolveBookingServiceIds,
  syncBookingServices,
} from './booking-services.util';

@Injectable()
export class BookingsAdminService {
  private readonly logger = new Logger(BookingsAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly mail: MailService,
    private readonly adminActivityNotify: AdminCustomerActivityNotifyService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
    private readonly config: ConfigService,
  ) {}

  private emailBrandingForTemplates() {
    return emailBrandingFromConfig(this.config);
  }

  async enrichBookingDetails(
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

  validateBookingTimeRange(details?: SanitizedInquiryDetails): void {
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

  async assertNoDuplicateSlot(
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
          'A confirmed booking already exists for that time slot.',
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

  async assertBookingCatalogRefs(dto: {
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
        select: { id: true, catalogChannel: true },
      });
      if (!row) throw new BadRequestException('Invalid eventTypeId.');
      if (row.catalogChannel !== EventTypeCatalogChannel.BOOKING) {
        throw new BadRequestException(
          'This event belongs to ON COMING EVENTS and cannot be used for bookings.',
        );
      }
    }
    if (dto.occasionTypeId) {
      const row = await this.prisma.occasionType.findUnique({
        where: { id: dto.occasionTypeId },
      });
      if (!row) throw new BadRequestException('Invalid occasionTypeId.');
    }
    if (dto.eventId) {
      const ev = await this.prisma.event.findFirst({
        where: { id: dto.eventId },
        select: {
          id: true,
          eventTypeId: true,
          publicSection: true,
          eventType: { select: { catalogChannel: true } },
        },
      });
      if (!ev) throw new BadRequestException('Invalid eventId.');
      if (dto.eventTypeId && ev.eventTypeId !== dto.eventTypeId) {
        throw new BadRequestException(
          'eventId does not belong to eventTypeId.',
        );
      }
      if (
        ev.publicSection !== EventPublicSection.GENERAL ||
        ev.eventType.catalogChannel !== EventTypeCatalogChannel.BOOKING
      ) {
        throw new BadRequestException(
          'This event belongs to ON COMING EVENTS and cannot be used for bookings.',
        );
      }
    }
  }

  async createAdminBooking(adminUserId: string, dto: CreateAdminBookingDto) {
    this.validateGuestVsUser(dto);
    await this.assertBookingCatalogRefs(dto);

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

    const created = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
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
        include: adminListInclude,
      });

      await syncBookingServices(
        tx,
        booking.id,
        resolveBookingServiceIds(dto.serviceId, enriched),
      );

      if (
        dto.contactRequestId &&
        bookingSource === BookingSource.ADMIN_FROM_CONTACT
      ) {
        await tx.contactRequest.update({
          where: { id: dto.contactRequestId },
          data: {
            status: ContactRequestStatus.RESERVED,
            isRead: true,
          },
        });
      }

      const withServices = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
        include: adminListInclude,
      });
      return withServices;
    });

    await this.sendBookingCreatedConfirmation(created);

    return created;
  }

  async sendBookingCreatedConfirmation(
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
        include: adminListInclude,
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);
    return {
      items: items.map((item) => this.withCatalogMismatchFlag(item)),
      meta: buildPaginationMeta({ page, perPage, totalItems }),
    };
  }

  async findCalendarAdmin(query: AdminCalendarQueryDto) {
    const where: Prisma.BookingWhereInput = {
      eventDate: {
        gte: new Date(query.from),
        lte: new Date(query.to),
      },
    };
    if (query.activeOnly) {
      where.status = {
        in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      };
    }
    const items = await this.prisma.booking.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: calendarInclude,
    });
    return { items };
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.booking.findUnique({
      where: { id },
      include: adminListInclude,
    });
    if (!row) throw new NotFoundException('Booking not found.');
    return this.withCatalogMismatchFlag(row);
  }

  /** Read-only diagnostic: historical booking referencing a hub type. Does not mutate the row. */
  private withCatalogMismatchFlag<
    T extends {
      eventType?: { catalogChannel?: EventTypeCatalogChannel } | null;
    },
  >(row: T): T & { catalogMismatch: boolean } {
    return {
      ...row,
      catalogMismatch:
        row.eventType?.catalogChannel === EventTypeCatalogChannel.UPCOMING_HUB,
    };
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
      await this.assertBookingCatalogRefs({
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

    const shouldSyncServices =
      dto.serviceId !== undefined ||
      dto.bookingDetails !== undefined ||
      catalogFieldsChanged;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.booking.update({
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
        include: adminListInclude,
      });

      if (shouldSyncServices) {
        await syncBookingServices(
          tx,
          id,
          resolveBookingServiceIds(
            serviceId,
            enrichedDetails ?? row.bookingDetails,
          ),
        );
      }

      return tx.booking.findUniqueOrThrow({
        where: { id },
        include: adminListInclude,
      });
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

  bookingContextLabel(booking: {
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

  bookingEventDateLabel(
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
