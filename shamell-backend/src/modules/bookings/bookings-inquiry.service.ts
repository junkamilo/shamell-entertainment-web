import { Injectable, Logger } from '@nestjs/common';
import { BookingSource, BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { parseHHMM, utcInstantForWallClock } from '../availability/booking-tz';
import type { SanitizedInquiryDetails } from '../booking-inquiry/contact-inquiry-details';
import {
  bookingDetailsForPublicInquiry,
  resolvePrimaryServiceIdForInquiry,
} from '../booking-inquiry/contact-inquiry-booking';
import type { CreateContactDto } from '../contact/dto/create-contact.dto';
import { BookingsAdminService } from './bookings-admin.service';
import {
  adminListInclude,
  type BookingWithRelations,
} from './booking-includes';
import {
  resolveBookingServiceIds,
  syncBookingServices,
} from './booking-services.util';

export type CreateFromPublicBookingInquiryOptions = {
  tx?: Prisma.TransactionClient;
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
export class BookingsInquiryService {
  private readonly logger = new Logger(BookingsInquiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly admin: BookingsAdminService,
  ) {}

  async notifyBookingCreated(booking: BookingWithRelations): Promise<void> {
    await this.admin.sendBookingCreatedConfirmation(booking);
  }

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
    this.admin.validateBookingTimeRange(detailsAligned);

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
    await this.admin.assertNoDuplicateSlot(eventInstant, detailsAligned);

    const detailsEnriched = await this.admin.enrichBookingDetails(detailsAligned);

    const eventTypeId = trimUuidField(detailsAligned.eventTypeId);
    const occasionTypeId = trimUuidField(detailsAligned.occasionTypeId);
    const eventId = trimUuidField(detailsAligned.eventId);

    if (eventTypeId || eventId) {
      await this.admin.assertBookingCatalogRefs({
        serviceId,
        eventTypeId,
        occasionTypeId,
        eventId,
      });
    }

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
      include: adminListInclude,
    });

    await syncBookingServices(
      db,
      created.id,
      resolveBookingServiceIds(prepared.serviceId, prepared.bookingDetails),
    );

    const withServices = await db.booking.findUniqueOrThrow({
      where: { id: created.id },
      include: adminListInclude,
    });

    if (!options?.skipConfirmationEmail) {
      await this.admin.sendBookingCreatedConfirmation(withServices);
    }
    this.logger.log(
      `Booking ${withServices.id} created from public inquiry ${contactRequestId}`,
    );
    return withServices;
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
