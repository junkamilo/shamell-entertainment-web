import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingSource, BookingStatus, Prisma } from '@prisma/client';
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
import type { CreateAdminBookingDto } from './dto/create-admin-booking.dto';
import type { UpdateAdminBookingDto } from './dto/update-admin-booking.dto';

const bookingInclude = {
  service: { include: { serviceType: true } },
  eventType: true,
  occasionType: true,
  event: true,
  user: true,
  createdByAdmin: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.BookingInclude;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
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
    return out;
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
    }

    const detailsRaw = dto.bookingDetails
      ? sanitizeInquiryDetails(dto.bookingDetails)
      : undefined;
    this.validateBookingTimeRange(detailsRaw);
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

    return this.prisma.booking.create({
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

    let eventDate = existing.eventDate;
    if (dto.eventDate !== undefined) {
      eventDate = new Date(dto.eventDate);
      if (Number.isNaN(eventDate.getTime())) {
        throw new BadRequestException('Invalid eventDate.');
      }
      await this.availability.assertDateTimeAllowed(eventDate);
      await this.assertNoDuplicateSlot(eventDate, existing.bookingDetails, id);
    }

    return this.prisma.booking.update({
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
      },
      include: bookingInclude,
    });
  }

  async removeAdmin(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.booking.delete({ where: { id } });
    return { ok: true };
  }
}
