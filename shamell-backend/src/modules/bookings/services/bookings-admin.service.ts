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
  EventPublicSection,
  EventTypeCatalogChannel,
  Prisma,
} from '@prisma/client';
import { buildPaginationMeta } from '../../../common/pagination/pagination.util';
import { AvailabilityService } from '../../availability/services/availability.service';
import { utcInstantForWallClock } from '../../availability/utils/booking-tz';
import { sanitizeInquiryDetails } from '../../booking-inquiry/utils/contact-inquiry-details.util';
import type { SanitizedInquiryDetails } from '../../booking-inquiry/types/booking-inquiry.types';
import type { AdminBookingQueryDto } from '../dto/admin-booking-query.dto';
import type { AdminCalendarQueryDto } from '../dto/admin-calendar-query.dto';
import type { CreateAdminBookingDto } from '../dto/create-admin-booking.dto';
import type { UpdateAdminBookingDto } from '../dto/update-admin-booking.dto';
import {
  buildBookingConfirmationHtml,
  buildBookingConfirmationSubject,
  buildBookingConfirmationText,
  timesFromDetails,
  type BookingConfirmationTemplateInput,
} from '../mail/booking-confirmation.mail';
import { emailBrandingFromConfig } from '../../mail/utils/email-html-branding';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import type { BookingWithRelations } from '../constants/booking-includes';
import { resolveBookingServiceIds } from '../utils/booking-services.util';
import {
  bookingWindowFromEvent,
  rangesOverlap,
  validateBookingTimeRange as assertBookingTimeRange,
} from '../utils/booking-slot.util';
import { validateGuestVsUser } from '../utils/booking-guest.util';
import { BookingsRepository } from './bookings.repository';

@Injectable()
export class BookingsAdminService {
  private readonly logger = new Logger(BookingsAdminService.name);

  constructor(
    private readonly repository: BookingsRepository,
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
      const rows = await this.repository.findOccasionTypeNamesByIds([...ids]);
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
      const et = await this.repository.findEventTypeName(details.eventTypeId);
      if (et) out.eventTypeLabel = et.name;
    }
    if (details.serviceIds?.length) {
      const rows = await this.repository.findServicesWithTypeNames(
        details.serviceIds,
      );
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
    const rows = await this.repository.findServiceIdsExisting(
      details.serviceIds,
    );
    if (rows.length !== details.serviceIds.length) {
      throw new BadRequestException(
        'One or more bookingDetails.serviceIds are not valid services.',
      );
    }
  }

  validateBookingTimeRange(details?: SanitizedInquiryDetails): void {
    assertBookingTimeRange(details);
  }

  async assertNoDuplicateSlot(
    eventDate: Date,
    bookingDetails?: unknown,
    excludeId?: string,
  ): Promise<void> {
    const tz = this.availability.bookingTimeZone();
    const incoming = bookingWindowFromEvent(eventDate, bookingDetails, tz);
    const dayStart = utcInstantForWallClock(incoming.dateISO, 0, tz);
    const dayEnd = utcInstantForWallClock(incoming.dateISO, 23 * 60 + 59, tz);

    const slots = await this.repository.findActiveSlotsInDayRange(
      dayStart,
      dayEnd,
      excludeId,
    );

    for (const row of slots) {
      const existing = bookingWindowFromEvent(
        row.eventDate,
        row.bookingDetails,
        tz,
      );
      if (existing.dateISO !== incoming.dateISO) continue;
      if (
        rangesOverlap(
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
    const bookings = await this.repository.findOccupiedBookingsInDayRange(
      dayStart,
      dayEnd,
    );
    const occupied = bookings
      .map((b) => bookingWindowFromEvent(b.eventDate, b.bookingDetails, tz))
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
    const service = await this.repository.findServiceById(dto.serviceId);
    if (!service) throw new BadRequestException('Invalid serviceId.');

    if (dto.eventTypeId) {
      const row = await this.repository.findEventTypeCatalogChannel(
        dto.eventTypeId,
      );
      if (!row) throw new BadRequestException('Invalid eventTypeId.');
      if (row.catalogChannel !== EventTypeCatalogChannel.BOOKING) {
        throw new BadRequestException(
          'This event belongs to ON COMING EVENTS and cannot be used for bookings.',
        );
      }
    }
    if (dto.occasionTypeId) {
      const row = await this.repository.findOccasionTypeById(
        dto.occasionTypeId,
      );
      if (!row) throw new BadRequestException('Invalid occasionTypeId.');
    }
    if (dto.eventId) {
      const ev = await this.repository.findBookingCatalogEvent(dto.eventId);
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
    validateGuestVsUser(dto);
    await this.assertBookingCatalogRefs(dto);

    if (dto.userId) {
      const u = await this.repository.findUserById(dto.userId);
      if (!u) throw new BadRequestException('Invalid userId.');
    }

    if (dto.contactRequestId) {
      const contact = await this.repository.findContactRequestById(
        dto.contactRequestId,
      );
      if (!contact) throw new BadRequestException('Invalid contactRequestId.');
      const existingForContact =
        await this.repository.findBookingIdByContactRequestId(
          dto.contactRequestId,
        );
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

    const created = await this.repository.createAdminBookingWithServices({
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
        bookingDetails: enriched === undefined ? undefined : enriched,
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
      serviceIds: resolveBookingServiceIds(dto.serviceId, enriched),
      contactRequestId: dto.contactRequestId ?? null,
      markContactReserved:
        Boolean(dto.contactRequestId) &&
        bookingSource === BookingSource.ADMIN_FROM_CONTACT,
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
      this.repository.countBookings(where),
      this.repository.findBookingsAdminList(
        where,
        (page - 1) * perPage,
        perPage,
      ),
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
    const items = await this.repository.findBookingsCalendar(where);
    return { items };
  }

  async findOneAdmin(id: string) {
    const row = await this.repository.findBookingAdminById(id);
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

    const updated = await this.repository.updateAdminBookingWithServices({
      id,
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
      shouldSyncServices,
      serviceIds: shouldSyncServices
        ? resolveBookingServiceIds(
            serviceId,
            enrichedDetails ?? existing.bookingDetails,
          )
        : undefined,
    });

    if (dto.status === BookingStatus.CANCELLED && existing.contactRequestId) {
      await this.cancelLinkedContactRequest(existing.contactRequestId);
    }

    if (
      dto.status === BookingStatus.CANCELLED &&
      existing.status !== BookingStatus.CANCELLED
    ) {
      await this.repository.cancelPendingBookingPayments(updated.id);
      await this.notifyAdminBookingCancelled(updated);
    }

    return updated;
  }

  async removeAdmin(id: string, options?: { purgeContact?: boolean }) {
    const existing = await this.findOneAdmin(id);
    await this.repository.removeAdminBooking({
      id,
      contactRequestId: existing.contactRequestId,
      purgeContact: options?.purgeContact,
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
    await this.repository.updateContactRequestCancelled(contactRequestId);
  }
}
