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
import { buildPaginationMeta } from '../../common/pagination/pagination.util';
import { AvailabilityService } from '../availability/availability.service';
import { parseHHMM, utcInstantForWallClock } from '../availability/booking-tz';
import { AdminContactQueryDto } from './dto/admin-contact-query.dto';
import { AdminPeticionesQueryDto } from './dto/admin-peticiones-query.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import {
  computeBookingGuideInvestmentUsd,
  type GuideInvestmentCompute,
} from '../booking-inquiry/booking-guide-investment';
import {
  BOOKING_INQUIRY_ENTRY_SOURCES,
  formatInquiryDetailsSummary,
  sanitizeInquiryDetails,
  type SanitizedInquiryDetails,
} from '../booking-inquiry/contact-inquiry-details';
import { ContactInboxService } from './contact-inbox.service';
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
import { AdminCustomerActivityNotifyService } from '../mail/admin-customer-activity-notify.service';
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
    private readonly adminActivityNotify: AdminCustomerActivityNotifyService,
    private readonly config: ConfigService,
    private readonly bookings: BookingsService,
    private readonly inbox: ContactInboxService,
  ) {}

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

  countPeticionesBadge(query: { since?: number; lane?: string }) {
    return this.inbox.countPeticionesBadge(query);
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
        await this.adminActivityNotify.notifyCustomerActivity({
          kind: 'CONCIERGE_INQUIRY',
          customerName: toName,
          customerEmail: to,
          detailsLines: this.contactInquiryDetailLines(dto),
        });
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
        const detailsLines = this.contactInquiryDetailLines(dto);
        if (guide?.totalUsd != null) {
          detailsLines.push(
            `Guide estimate: $${guide.totalUsd.toFixed(2)} USD`,
          );
        }
        await this.adminActivityNotify.notifyCustomerActivity({
          kind: 'BOOKING_INQUIRY',
          customerName: toName,
          customerEmail: to,
          contextLabel: dto.serviceType ?? dto.subject?.trim() ?? undefined,
          detailsLines,
        });
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

  private contactInquiryDetailLines(dto: CreateContactDto): string[] {
    const lines: string[] = [];
    const phone = dto.phone?.trim();
    if (phone) lines.push(`Phone: ${phone}`);
    const eventDate = dto.eventDate?.trim();
    if (eventDate) lines.push(`Event date: ${eventDate}`);
    const location = dto.location?.trim();
    if (location) lines.push(`Location: ${location}`);
    const message = dto.message.trim();
    if (message) {
      const excerpt =
        message.length > 280 ? `${message.slice(0, 277)}…` : message;
      lines.push(`Message: ${excerpt}`);
    }
    return lines;
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

    return {
      items,
      meta: buildPaginationMeta({ page, perPage, totalItems }),
    };
  }

  findAllPeticiones(query: AdminPeticionesQueryDto) {
    return this.inbox.findAllPeticiones(query);
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
