// src/modules/contact/contact.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingStatus,
  ContactRequest,
  ContactRequestStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { parseHHMM, utcInstantForWallClock } from '../availability/booking-tz';
import { AdminContactQueryDto } from './dto/admin-contact-query.dto';
import { AdminPeticionesQueryDto } from './dto/admin-peticiones-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  computeBookingGuideInvestmentUsd,
  type GuideInvestmentCompute,
} from './booking-guide-investment';
import {
  BOOKING_INQUIRY_ENTRY_SOURCES,
  formatInquiryDetailsSummary,
  sanitizeInquiryDetails,
  type SanitizedInquiryDetails,
} from './contact-inquiry-details';
import {
  buildBookingInquiryAckHtml,
  buildBookingInquiryAckSubject,
  buildBookingInquiryAckText,
} from './booking-inquiry-ack.mail';
import {
  buildConciergeInquiryAckHtml,
  buildConciergeInquiryAckSubject,
  buildConciergeInquiryAckText,
} from './concierge-inquiry-ack.mail';
import { buildConciergeVisionSnapshot } from './concierge-vision-snapshot';
import { emailBrandingFromConfig } from '../mail/email-html-branding';
import { MailService } from '../mail/mail.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  /** Window to treat duplicate public booking inquiries as idempotent. */
  private static readonly BOOKING_INQUIRY_DEDUPE_MS = 15 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly bookings: BookingsService,
  ) {}

  private readonly bookingFeedInclude = {
    service: { include: { serviceType: true } },
    eventType: true,
    occasionType: true,
    event: true,
    user: true,
  } satisfies Prisma.BookingInclude;

  private async enrichInquiryDetails(
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

  async create(dto: CreateContactDto) {
    const {
      eventDate,
      subject,
      inquiryDetails: rawInquiryDetails,
      message,
      ...rest
    } = dto;
    const inquiryDetails = sanitizeInquiryDetails(rawInquiryDetails);
    let enriched: SanitizedInquiryDetails | undefined =
      inquiryDetails && Object.keys(inquiryDetails).length > 0
        ? await this.enrichInquiryDetails(inquiryDetails)
        : undefined;

    let guideForAck: GuideInvestmentCompute | undefined;
    if (enriched) {
      const guide = await computeBookingGuideInvestmentUsd(
        this.prisma,
        enriched,
      );
      if (guide.totalUsd != null || guide.isPartial) {
        guideForAck = guide;
        enriched = {
          ...enriched,
          ...(guide.totalUsd != null
            ? { guideInvestmentTotalUsd: guide.totalUsd }
            : {}),
          ...(guide.isPartial ? { guideInvestmentIsPartial: true } : {}),
        };
      }
    }

    if (eventDate) {
      const tz = this.availability.bookingTimeZone();
      let minuteOfDay = 12 * 60;
      if (
        enriched?.eventTimeStart &&
        /^\d{2}:\d{2}$/.test(enriched.eventTimeStart.trim())
      ) {
        try {
          minuteOfDay = parseHHMM(
            enriched.eventTimeStart.trim(),
            'eventTimeStart',
          );
        } catch {
          throw new BadRequestException(
            'Invalid eventTimeStart in inquiryDetails.',
          );
        }
      }
      const probe = utcInstantForWallClock(eventDate.trim(), minuteOfDay, tz);
      await this.availability.assertDateTimeAllowed(probe);
    }

    const summaryBlock =
      enriched && Object.keys(enriched).length > 0
        ? formatInquiryDetailsSummary(enriched, dto.serviceType)
        : '';
    const trimmedMessage = message.trim();
    const composedMessage = summaryBlock
      ? `${summaryBlock}\n\n---\n\n${trimmedMessage}`
      : trimmedMessage;

    const entrySource = enriched?.entrySource;
    const isBookingInquiry =
      !!entrySource &&
      (BOOKING_INQUIRY_ENTRY_SOURCES as readonly string[]).includes(
        entrySource,
      );

    const resolvedSubject =
      subject?.trim() ||
      (isBookingInquiry
        ? `Booking inquiry${dto.serviceType ? ` — ${dto.serviceType}` : ''}`
        : `Reservation inquiry${dto.serviceType ? ` — ${dto.serviceType}` : ''}`);

    if (isBookingInquiry && eventDate && dto.email?.trim() && enriched) {
      const duplicate = await this.findBookingInquiryDuplicate(
        dto.email.trim(),
        eventDate.trim(),
      );
      if (duplicate) {
        this.logger.log(
          `Duplicate booking inquiry ignored for ${dto.email} (contact ${duplicate.id}).`,
        );
        return duplicate;
      }

      const preparedBooking = await this.bookings.preparePublicBookingInquiry(
        dto,
        enriched,
      );

      const materialized = await this.prisma.$transaction(
        async (tx) => {
          const created = await tx.contactRequest.create({
            data: {
              ...rest,
              message: composedMessage,
              subject: resolvedSubject,
              status: ContactRequestStatus.PENDING,
              eventDate: new Date(eventDate),
              inquiryDetails: enriched,
            },
          });

          if (!preparedBooking) {
            return created;
          }

          await this.bookings.insertPublicBookingInquiry(
            created.id,
            preparedBooking,
            { tx, skipConfirmationEmail: true },
          );

          return tx.contactRequest.update({
            where: { id: created.id },
            data: {
              status: ContactRequestStatus.RESERVED,
              isRead: true,
            },
          });
        },
        { maxWait: 10_000, timeout: 15_000 },
      );

      await this.sendBookingInquiryAckEmail(dto, guideForAck);
      // Booking confirmation is now sent only after payment completion.

      return materialized;
    }

    const created = await this.prisma.contactRequest.create({
      data: {
        ...rest,
        message: composedMessage,
        subject: resolvedSubject,
        status: ContactRequestStatus.PENDING,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        inquiryDetails:
          enriched === undefined
            ? undefined
            : (enriched as unknown as Prisma.InputJsonValue),
        conciergeVisionSnapshot:
          enriched?.entrySource === 'concierge_gate'
            ? (buildConciergeVisionSnapshot(
                dto,
              ) as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });

    if (enriched?.entrySource === 'concierge_gate') {
      await this.sendConciergeInquiryAckEmail(dto);
    }

    return created;
  }

  /**
   * Returns an existing contact row when this public booking inquiry is a duplicate
   * (same guest/day or recent contact with an active booking).
   */
  private async findBookingInquiryDuplicate(
    email: string,
    eventDateIso: string,
  ): Promise<ContactRequest | null> {
    const emailNorm = email.trim().toLowerCase();
    const eventDateObj = new Date(eventDateIso);
    const since = new Date(
      Date.now() - ContactService.BOOKING_INQUIRY_DEDUPE_MS,
    );
    const tz = this.availability.bookingTimeZone();
    const dayStart = utcInstantForWallClock(eventDateIso, 0, tz);
    const dayEnd = utcInstantForWallClock(eventDateIso, 23 * 60 + 59, tz);

    const activeBooking = await this.prisma.booking.findFirst({
      where: {
        guestEmail: emailNorm,
        status: { not: BookingStatus.CANCELLED },
        eventDate: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { createdAt: 'desc' },
      select: { contactRequestId: true },
    });
    if (activeBooking?.contactRequestId) {
      const contact = await this.prisma.contactRequest.findUnique({
        where: { id: activeBooking.contactRequestId },
      });
      if (contact) return contact;
    }

    const recentContact = await this.prisma.contactRequest.findFirst({
      where: {
        email: emailNorm,
        eventDate: eventDateObj,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!recentContact) return null;

    const linkedBooking = await this.prisma.booking.findFirst({
      where: {
        contactRequestId: recentContact.id,
        status: { not: BookingStatus.CANCELLED },
      },
      select: { id: true },
    });
    if (linkedBooking) return recentContact;

    return null;
  }

  private peticionesSqlFragments() {
    const isOrphanContact = Prisma.sql`
      NOT EXISTS (
        SELECT 1
        FROM "bookings" b
        WHERE b."contactRequestId" = cr.id
      )
    `;
    const isShadowedBookingInquiryContact = Prisma.sql`
      NOT (
        (cr."inquiryDetails"->>'entrySource') IN ('contact_page', 'home_service_card', 'inquire_section')
        AND EXISTS (
          SELECT 1
          FROM "bookings" b
          WHERE LOWER(TRIM(b."guestEmail")) = LOWER(TRIM(cr.email))
            AND cr."eventDate" IS NOT NULL
            AND DATE(b."eventDate") = DATE(cr."eventDate")
            AND b."createdAt" BETWEEN cr."createdAt" - INTERVAL '30 minutes'
              AND cr."createdAt" + INTERVAL '30 minutes'
        )
      )
    `;
    const isConciergeContact = Prisma.sql`
      (
        (cr."inquiryDetails"->>'entrySource') = 'concierge_gate'
        OR LOWER(COALESCE(cr."subject", '')) LIKE '%concierge inquiry%'
      )
    `;
    return {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
    };
  }

  async countPeticionesBadge(query: {
    since?: number;
    lane?: string;
  }): Promise<{ count: number }> {
    const lane = query.lane === 'guidance' ? 'guidance' : 'bookings';
    const since =
      query.since != null && Number.isFinite(query.since) && query.since > 0
        ? new Date(query.since)
        : null;
    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
    } = this.peticionesSqlFragments();
    const sinceFilter = since
      ? Prisma.sql`WHERE unified.created_at > ${since}`
      : Prisma.empty;

    if (lane === 'guidance') {
      const rows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM (
          SELECT cr."createdAt" AS created_at
          FROM "contact_requests" cr
          WHERE ${isOrphanContact}
            AND ${isConciergeContact}
        ) unified
        ${sinceFilter}
      `);
      return { count: Number(rows[0]?.total ?? 0n) };
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ total: bigint }>
    >(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM (
        SELECT cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
        UNION ALL
        SELECT b."createdAt" AS created_at
        FROM "bookings" b
      ) unified
      ${sinceFilter}
    `);
    return { count: Number(rows[0]?.total ?? 0n) };
  }

  /**
   * Thanks the guest via MailerSend. Does not throw; logs on skip/failure.
   */
  private async sendConciergeInquiryAckEmail(
    dto: CreateContactDto,
  ): Promise<void> {
    try {
      const to = dto.email.trim().toLowerCase();
      if (!to) {
        this.logger.warn('Concierge ack email skipped: empty recipient.');
        return;
      }

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const branding = emailBrandingFromConfig(this.config);

      const toName = dto.fullName.trim() || to;
      const recipientFirstName = toName.split(/\s+/)[0] || toName;

      const templateInput = {
        recipientFirstName,
        appPublicName,
        siteUrl: branding.siteBaseUrl,
        branding,
      };

      const { ok } = await this.mail.sendTransactional({
        to,
        toName,
        subject: buildConciergeInquiryAckSubject(appPublicName),
        html: buildConciergeInquiryAckHtml(templateInput),
        text: buildConciergeInquiryAckText(templateInput),
      });

      if (ok) {
        this.logger.log(`Concierge inquiry ack email sent to ${to}`);
      } else {
        this.logger.warn(
          `Concierge inquiry ack email not sent to ${to} (MailerSend disabled or failed).`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Concierge inquiry ack email unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Acknowledges booking inquiry to the guest. Does not throw; logs on skip/failure. */
  private async sendBookingInquiryAckEmail(
    dto: CreateContactDto,
    guide?: GuideInvestmentCompute,
  ): Promise<void> {
    try {
      const to = dto.email.trim().toLowerCase();
      if (!to) {
        this.logger.warn('Booking inquiry ack email skipped: empty recipient.');
        return;
      }

      const appPublicName =
        this.config.get<string>('APP_PUBLIC_NAME')?.trim() ??
        'Shamell Entertainment';
      const branding = emailBrandingFromConfig(this.config);

      const toName = dto.fullName.trim() || to;
      const recipientFirstName = toName.split(/\s+/)[0] || toName;

      const templateInput = {
        recipientFirstName,
        appPublicName,
        siteUrl: branding.siteBaseUrl,
        branding,
        guideInvestment: guide,
      };

      const { ok } = await this.mail.sendTransactional({
        to,
        toName,
        subject: buildBookingInquiryAckSubject(appPublicName),
        html: buildBookingInquiryAckHtml(templateInput),
        text: buildBookingInquiryAckText(templateInput),
      });

      if (ok) {
        this.logger.log(`Booking inquiry ack email sent to ${to}`);
      } else {
        this.logger.warn(
          `Booking inquiry ack email not sent to ${to} (MailerSend disabled or failed).`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Booking inquiry ack email unexpected error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async findAll(query: AdminContactQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const where: Prisma.ContactRequestWhereInput = {};
    if (query.status) where.status = query.status;

    const [totalItems, items] = await Promise.all([
      this.prisma.contactRequest.count({ where }),
      this.prisma.contactRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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

  async findAllPeticiones(query: AdminPeticionesQueryDto) {
    const page = Math.max(1, Number(query.page ?? 1));
    const perPage = Number(query.perPage ?? 10);
    const skip = (page - 1) * perPage;
    const lane = query.lane === 'guidance' ? 'guidance' : 'bookings';

    const {
      isOrphanContact,
      isShadowedBookingInquiryContact,
      isConciergeContact,
    } = this.peticionesSqlFragments();

    if (lane === 'guidance') {
      const guidanceCountRows = await this.prisma.$queryRaw<
        Array<{ total: bigint }>
      >(Prisma.sql`
          SELECT COUNT(*)::bigint AS total
          FROM "contact_requests" cr
          WHERE ${isOrphanContact}
            AND ${isConciergeContact}
        `);
      const totalItems = Number(guidanceCountRows[0]?.total ?? 0n);
      const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
      if (totalItems === 0) {
        return {
          items: [],
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

      const feedRows = await this.prisma.$queryRaw<
        Array<{
          origin: 'CONTACT' | 'BOOKING_ADMIN';
          id: string;
          created_at: Date;
        }>
      >(Prisma.sql`
        SELECT 'CONTACT'::text AS origin, cr.id AS id, cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isConciergeContact}
        ORDER BY cr."createdAt" DESC
        OFFSET ${skip}
        LIMIT ${perPage}
      `);

      return this.hydratePeticionesPage(
        feedRows,
        page,
        perPage,
        totalItems,
        totalPages,
      );
    }

    const [nonConciergeOrphanRows, bookingTotalRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
      `),
      this.prisma.booking.count(),
    ]);
    const nonConciergeOrphanTotal = Number(
      nonConciergeOrphanRows[0]?.total ?? 0n,
    );
    const bookingTotal = bookingTotalRows;
    const totalItems = bookingTotal + nonConciergeOrphanTotal;
    const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / perPage);
    if (totalItems === 0) {
      return {
        items: [],
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

    const feedRows = await this.prisma.$queryRaw<
      Array<{
        origin: 'CONTACT' | 'BOOKING_ADMIN';
        id: string;
        created_at: Date;
      }>
    >(Prisma.sql`
      SELECT *
      FROM (
        SELECT 'CONTACT'::text AS origin, cr.id AS id, cr."createdAt" AS created_at
        FROM "contact_requests" cr
        WHERE ${isOrphanContact}
          AND ${isShadowedBookingInquiryContact}
          AND NOT ${isConciergeContact}
        UNION ALL
        SELECT 'BOOKING_ADMIN'::text AS origin, b.id AS id, b."createdAt" AS created_at
        FROM "bookings" b
      ) unified
      ORDER BY created_at DESC
      OFFSET ${skip}
      LIMIT ${perPage}
    `);

    return this.hydratePeticionesPage(
      feedRows,
      page,
      perPage,
      totalItems,
      totalPages,
    );
  }

  private async hydratePeticionesPage(
    feedRows: Array<{
      origin: 'CONTACT' | 'BOOKING_ADMIN';
      id: string;
      created_at: Date;
    }>,
    page: number,
    perPage: number,
    totalItems: number,
    totalPages: number,
  ) {
    const contactIds = feedRows
      .filter((r) => r.origin === 'CONTACT')
      .map((r) => r.id);
    const bookingIds = feedRows
      .filter((r) => r.origin === 'BOOKING_ADMIN')
      .map((r) => r.id);

    const [contactRows, bookingRows] = await Promise.all([
      this.prisma.contactRequest.findMany({
        where: { id: { in: contactIds } },
        include: { _count: { select: { bookings: true } } },
      }),
      this.prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: this.bookingFeedInclude,
      }),
    ]);

    const linkedContactIds = [
      ...new Set(
        bookingRows
          .map((b) => b.contactRequestId)
          .filter(
            (id): id is string => typeof id === 'string' && id.length > 0,
          ),
      ),
    ].filter((id) => !contactIds.includes(id));

    const linkedContactRows =
      linkedContactIds.length > 0
        ? await this.prisma.contactRequest.findMany({
            where: { id: { in: linkedContactIds } },
          })
        : [];

    const contactById = new Map(
      [...contactRows, ...linkedContactRows].map((row) => [row.id, row]),
    );
    const hasLinkedBookingByContactId = new Map(
      contactRows.map((row) => [row.id, row._count.bookings > 0]),
    );
    const bookingById = new Map(bookingRows.map((row) => [row.id, row]));
    const pageItems = feedRows
      .map((row) => {
        if (row.origin === 'CONTACT') {
          const contact = contactById.get(row.id);
          if (!contact) return null;
          return {
            origin: 'CONTACT' as const,
            id: contact.id,
            createdAt: contact.createdAt,
            state: contact.status,
            hasLinkedBooking:
              hasLinkedBookingByContactId.get(contact.id) ?? false,
            contact,
          };
        }
        const booking = bookingById.get(row.id);
        if (!booking) return null;
        const linkedContact = booking.contactRequestId
          ? (contactById.get(booking.contactRequestId) ?? null)
          : null;
        return {
          origin: 'BOOKING_ADMIN' as const,
          id: booking.id,
          createdAt: booking.createdAt,
          status: booking.status,
          booking,
          ...(linkedContact ? { linkedContact } : {}),
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    return {
      items: pageItems,
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

  async findOne(id: string) {
    const contact = await this.prisma.contactRequest.findUnique({
      where: { id },
    });
    if (!contact) throw new NotFoundException('Contact request not found');
    return contact;
  }

  async markAsRead(id: string) {
    await this.findOne(id); // valida que exista
    return this.prisma.contactRequest.update({
      where: { id },
      data: { isRead: true, status: ContactRequestStatus.RESERVED },
    });
  }

  async updateStatus(id: string, status: ContactRequestStatus) {
    await this.findOne(id);
    return this.prisma.contactRequest.update({
      where: { id },
      data: {
        status,
        isRead: status === ContactRequestStatus.PENDING ? false : true,
      },
    });
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    if (row.status !== ContactRequestStatus.CANCELLED) {
      throw new BadRequestException(
        'Only cancelled contact requests can be deleted.',
      );
    }
    return this.prisma.contactRequest.delete({ where: { id } });
  }
}
