import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  FixedTicketMode,
  Prisma,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
  VenueReservationPaymentChannel,
} from '@prisma/client';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { emailBrandingFromProcessEnv } from '../../mail/utils/email-html-branding';
import {
  buildClassPaymentRequestHtml,
  buildClassPaymentRequestSubject,
  buildClassPaymentRequestText,
} from '../mail/class-payment-request.mail';
import {
  buildFixedTicketConfirmationHtml,
  buildFixedTicketConfirmationSubject,
  buildFixedTicketConfirmationText,
  packageSnapshotFromEnrollment,
} from '../mail/fixed-ticket-confirmation.mail';
import { fixedTicketNotifyFieldsFromEnrollment } from '../mail/fixed-ticket-notify.util';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../../stripe/utils/stripe-tax.util';
import { StripeService } from '../../stripe/services/stripe.service';
import { CHECKOUT_TTL_MINUTES } from '../constants/upcoming-events.constants';
import { resolveUpcomingPurchaseContext } from '../utils/upcoming-purchase-mode.util';
import {
  fixedTicketsRemaining,
  getFixedTicketInventory,
} from '../utils/upcoming-fixed-ticket.util';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import {
  FIXED_EVENT_PACKAGE_ERROR_CODES,
  packageErrorBody,
} from '../packages/util/fixed-event-package-errors';
import {
  buildPackageSnapshotInclusions,
  formatArrivalLabel,
  mapPackagePublic,
} from '../packages/util/fixed-event-package.mapper';
import type { CreateAdminFixedEventEnrollmentDto } from '../dto/create-admin-fixed-event-enrollment.dto';
import { UpcomingEventsRepository } from './upcoming-events.repository';

@Injectable()
export class AdminFixedEventEnrollmentService {
  private readonly logger = new Logger(AdminFixedEventEnrollmentService.name);

  constructor(
    private readonly repository: UpcomingEventsRepository,
    private readonly packagesRepository: UpcomingFixedEventPackagesRepository,
    private readonly stripeService: StripeService,
    private readonly mail: MailService,
    private readonly adminPaymentNotify: AdminPaymentNotifyService,
  ) {}

  private get prisma() {
    return this.repository.asPrisma();
  }

  async listBoxOfficeFixedEvents() {
    const events = await this.repository.listBoxOfficeEligibleEvents();

    const out: Array<{
      id: string;
      name: string;
      slug: string | null;
      purchaseKind: 'venue_seating' | 'fixed_ticket';
      ticketMode: 'SINGLE' | 'PACKAGES';
      price: number | null;
      currency: string;
      ticketsRemaining: number | null;
      fixedTicketCapacity: number | null;
      packages: Array<{
        id: string;
        title: string;
        price: number;
        capacity: number;
        sold: number;
        remaining: number;
      }>;
      floorLayoutId: string | null;
      eventDateIso: string | null;
      eventLabel: string | null;
    }> = [];

    for (const event of events) {
      const vc = event.venueConfig;
      const templateMode = vc?.reservationEventTemplate?.scheduleMode ?? null;
      const price = event.price != null ? Number(event.price) : null;
      const ticketMode =
        vc?.fixedTicketMode === FixedTicketMode.PACKAGES
          ? 'PACKAGES'
          : 'SINGLE';
      const capacity = vc?.fixedTicketCapacity ?? null;

      let ticketsRemaining: number | null = null;
      let packages: (typeof out)[number]['packages'] = [];

      if (
        ticketMode === 'PACKAGES' &&
        templateMode === ReservationEventScheduleMode.FIXED_EVENT &&
        !vc?.clientEnabled
      ) {
        const inventory = await getFixedTicketInventory(this.prisma, event.id, {
          fixedTicketMode: FixedTicketMode.PACKAGES,
          fixedTicketCapacity: null,
        });
        ticketsRemaining = inventory.total.remaining;
        const rows = await this.packagesRepository.listPackagesByEvent(
          event.id,
          true,
        );
        packages = rows.map((p) => {
          const slice = inventory.byPackage.get(p.id) ?? {
            capacity: p.capacity,
            blocking: 0,
            remaining: p.capacity,
            sold: 0,
          };
          return {
            id: p.id,
            title: p.title,
            price: p.priceCents / 100,
            capacity: p.capacity,
            sold: slice.sold,
            remaining: slice.remaining,
          };
        });
      } else if (capacity != null && capacity >= 1) {
        ticketsRemaining = await fixedTicketsRemaining(
          this.prisma,
          event.id,
          capacity,
        );
      }

      const ctx = resolveUpcomingPurchaseContext({
        experienceType: event.experienceType,
        price,
        clientEnabled: vc?.clientEnabled ?? false,
        templateScheduleMode: templateMode,
        reservationOpensAt: vc?.reservationOpensAt ?? null,
        reservationClosesAt: vc?.reservationClosesAt ?? null,
        reservationEventDate: vc?.reservationEventDate ?? null,
        reservationTimezone: vc?.reservationTimezone,
        fixedTicketCapacity: capacity,
        ticketsRemaining: ticketsRemaining ?? undefined,
        ticketMode,
        packages: packages.map((p) =>
          mapPackagePublic(
            {
              id: p.id,
              title: p.title,
              description: null,
              badge: null,
              priceCents: Math.round(p.price * 100),
              capacity: p.capacity,
              arrivalStartTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
              arrivalEndTime: null,
              displayOrder: 0,
              isActive: true,
              activityLinks: [],
            },
            {
              blocking: p.capacity - p.remaining,
              remaining: p.remaining,
              sold: p.sold,
            },
          ),
        ),
      });

      let purchaseKind: 'venue_seating' | 'fixed_ticket' | null = null;
      if (
        event.experienceType === UpcomingExperienceType.VENUE_SEATING &&
        (ctx.purchaseMode === 'venue_seating' || vc?.clientEnabled)
      ) {
        purchaseKind = 'venue_seating';
      } else if (ctx.purchaseMode === 'fixed_ticket') {
        purchaseKind = 'fixed_ticket';
      } else if (
        templateMode === ReservationEventScheduleMode.FIXED_EVENT &&
        !vc?.clientEnabled
      ) {
        purchaseKind = 'fixed_ticket';
      }

      if (!purchaseKind) continue;
      if (!event.slug?.trim() && purchaseKind === 'venue_seating') {
        // still list by id for admin
      }

      out.push({
        id: event.id,
        name: event.eventType.name.trim(),
        slug: event.slug,
        purchaseKind,
        ticketMode,
        price,
        currency: 'usd',
        ticketsRemaining,
        fixedTicketCapacity: capacity,
        packages,
        floorLayoutId: vc?.floorLayoutId ?? null,
        eventDateIso: vc?.reservationEventDate?.toISOString() ?? null,
        eventLabel: vc?.reservationEventLabel ?? null,
      });
    }

    return { events: out };
  }

  async createAdminCash(
    adminUserId: string,
    dto: CreateAdminFixedEventEnrollmentDto,
  ) {
    const resolved = await this.assertAdminFixedTicketEvent(dto);
    const { event, venueConfig, amount, packageSnapshot, packageCapacity } =
      resolved;
    const customer = this.normalizeCustomer(dto);

    const enrollment =
      await this.repository.createPaidFixedEnrollmentWithTicket(
        {
          eventId: event.id,
          amount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PAID,
          paymentChannel: VenueReservationPaymentChannel.CASH,
          stripeCheckoutSessionId: null,
          paymentMethodType: 'cash',
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          boxOfficeDetails: dto.boxOfficeDetails as Prisma.InputJsonValue,
          createdByAdminId: adminUserId,
          paidAt: new Date(),
          ...(packageSnapshot ?? {}),
        },
        event.id,
        packageCapacity ?? venueConfig.fixedTicketCapacity!,
      );

    const sent = await this.sendPaidConfirmation(enrollment, venueConfig);
    if (sent) {
      await this.repository.stampFixedEnrollmentEmailSent(enrollment.id);
    }

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',
      flow: 'FIXED_TICKET',
      ...fixedTicketNotifyFieldsFromEnrollment(
        enrollment,
        venueConfig.reservationEventLabel?.trim() ||
          (venueConfig.reservationEventDate
            ? venueConfig.reservationEventDate.toISOString()
            : null),
      ),
    });

    this.logger.log(
      `admin-fixed-ticket-cash enrollmentId=${enrollment.id} admin=${adminUserId}`,
    );

    return {
      enrollmentId: enrollment.id,
      ticketNumber: enrollment.ticketNumber,
      message: 'Ticket reserved.',
    };
  }

  async createAdminCheckoutSession(
    adminUserId: string,
    dto: CreateAdminFixedEventEnrollmentDto,
  ) {
    const resolved = await this.assertAdminFixedTicketEvent(dto);
    const { event, venueConfig, amount, packageSnapshot, packageCapacity } =
      resolved;
    const customer = this.normalizeCustomer(dto);

    const amountCents = Math.round(Number(amount) * 100);
    if (amountCents < 50) {
      throw new BadRequestException('Invalid event ticket price.');
    }

    const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MINUTES * 60 * 1000);
    const frontendUrl = this.stripeService.frontendUrl().replace(/\/$/, '');
    const slug = event.slug?.trim();
    if (!slug) {
      throw new BadRequestException(
        'Event slug is required for payment links.',
      );
    }
    const successUrl = `${frontendUrl}/on-coming-events/${encodeURIComponent(slug)}/return?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/shamell-admin/agenda/box-office`;

    const productName = packageSnapshot?.packageTitle
      ? `${event.eventType.name} — ${packageSnapshot.packageTitle}`
      : `${event.eventType.name} — ticket`;

    const checkout = await this.stripeService.client.checkout.sessions.create({
      mode: 'payment',
      customer_email: customer.customerEmail,
      ...stripeAutomaticTaxParams(),
      payment_intent_data: {
        receipt_email: customer.customerEmail,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: stripeTaxProductData({
              name: productName,
              description: venueConfig.reservationEventLabel ?? 'Event ticket',
            }),
          },
        },
      ],
      metadata: {
        flow: 'fixed_event_ticket',
        adminUserId,
        paymentChannel: 'STRIPE',
        ...(packageSnapshot?.packageId
          ? { package_id: packageSnapshot.packageId }
          : {}),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    });

    if (!checkout.url) {
      throw new BadRequestException('Could not start checkout.');
    }

    const enrollment =
      await this.repository.createPendingFixedEventEnrollmentLocked(
        {
          eventId: event.id,
          amount,
          currency: 'usd',
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          paymentChannel: VenueReservationPaymentChannel.STRIPE,
          stripeCheckoutSessionId: checkout.id,
          customerName: customer.customerName,
          customerEmail: customer.customerEmail,
          customerPhone: customer.customerPhone,
          boxOfficeDetails: dto.boxOfficeDetails as Prisma.InputJsonValue,
          createdByAdminId: adminUserId,
          expiresAt,
          ...(packageSnapshot
            ? {
                packageId: packageSnapshot.packageId,
                packageTitle: packageSnapshot.packageTitle,
                packagePriceCents: packageSnapshot.packagePriceCents,
                packageArrivalLabel: packageSnapshot.packageArrivalLabel,
                packageInclusions: packageSnapshot.packageInclusions,
              }
            : {}),
        },
        packageSnapshot
          ? {
              mode: 'PACKAGES' as const,
              packageId: packageSnapshot.packageId,
              packageCapacity: packageCapacity,
            }
          : {
              mode: 'SINGLE' as const,
              eventId: event.id,
              eventCapacity: venueConfig.fixedTicketCapacity!,
            },
      );

    await this.stripeService.client.checkout.sessions.update(checkout.id, {
      metadata: {
        flow: 'fixed_event_ticket',
        enrollmentId: enrollment.id,
        adminUserId,
        paymentChannel: 'STRIPE',
      },
    });

    const payUrl = checkout.url;
    const branding = emailBrandingFromProcessEnv();
    const appPublicName =
      process.env.APP_PUBLIC_NAME?.trim() || 'Shamell Entertainment';
    const amountUsd = `${Number(amount).toFixed(2)} USD`;
    await this.mail.sendTransactional({
      to: customer.customerEmail,
      toName: customer.customerName,
      subject: buildClassPaymentRequestSubject(appPublicName).replace(
        'class payment',
        'ticket payment',
      ),
      text: buildClassPaymentRequestText({
        recipientName: customer.customerName,
        appPublicName,
        frontendBaseUrl: branding.siteBaseUrl,
        branding,
        enrollmentReference: enrollment.id.slice(0, 8).toUpperCase(),
        eventLabel: event.eventType.name,
        classLabel: 'Event ticket',
        amountUsd,
        payUrl,
      }),
      html: buildClassPaymentRequestHtml({
        recipientName: customer.customerName,
        appPublicName,
        frontendBaseUrl: branding.siteBaseUrl,
        branding,
        enrollmentReference: enrollment.id.slice(0, 8).toUpperCase(),
        eventLabel: event.eventType.name,
        classLabel: 'Event ticket',
        amountUsd,
        payUrl,
      }),
    });

    this.logger.log(
      `admin-fixed-ticket-checkout enrollmentId=${enrollment.id} session=${checkout.id} admin=${adminUserId}`,
    );

    return {
      enrollmentId: enrollment.id,
      message: 'Payment link sent to customer.',
      payUrl,
    };
  }

  private normalizeCustomer(dto: CreateAdminFixedEventEnrollmentDto) {
    return {
      customerName: dto.customerName.trim(),
      customerEmail: dto.customerEmail.trim().toLowerCase(),
      customerPhone: dto.customerPhone?.trim() || null,
    };
  }

  private async assertAdminFixedTicketEvent(
    dto: CreateAdminFixedEventEnrollmentDto,
  ) {
    const event = await this.repository.findActiveUpcomingEventWithVenueConfig(
      dto.upcomingEventId,
    );
    if (!event) throw new NotFoundException('Upcoming event not found.');
    const venueConfig = event.venueConfig;
    if (
      !venueConfig?.reservationEventTemplate ||
      venueConfig.reservationEventTemplate.scheduleMode !==
        ReservationEventScheduleMode.FIXED_EVENT ||
      venueConfig.clientEnabled
    ) {
      throw new BadRequestException('This event does not offer fixed tickets.');
    }

    const ticketMode = venueConfig.fixedTicketMode ?? FixedTicketMode.SINGLE;

    if (ticketMode === FixedTicketMode.PACKAGES) {
      if (!dto.packageId) {
        throw new UnprocessableEntityException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_REQUIRED,
            'Select a ticket package to continue.',
          ),
        );
      }
      const packageRow = await this.packagesRepository.findPackageById(
        dto.packageId,
        event.id,
      );
      if (!packageRow) {
        throw new NotFoundException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_FOUND,
            'Package not found.',
          ),
        );
      }
      if (!packageRow.isActive) {
        throw new UnprocessableEntityException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_INACTIVE,
            'This package is no longer available.',
          ),
        );
      }
      const inventory = await getFixedTicketInventory(this.prisma, event.id, {
        fixedTicketMode: FixedTicketMode.PACKAGES,
        fixedTicketCapacity: null,
      });
      const slice = inventory.byPackage.get(packageRow.id);
      if (!slice || slice.remaining <= 0) {
        throw new ConflictException(
          packageErrorBody(
            FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_SOLD_OUT,
            'This package is sold out.',
          ),
        );
      }
      const packageSnapshot = {
        packageId: packageRow.id,
        packageTitle: packageRow.title,
        packagePriceCents: packageRow.priceCents,
        packageArrivalLabel: formatArrivalLabel(
          packageRow.arrivalStartTime,
          packageRow.arrivalEndTime,
        ),
        packageInclusions: buildPackageSnapshotInclusions(
          packageRow.activityLinks,
        ) as Prisma.InputJsonValue,
      };
      return {
        event,
        venueConfig,
        amount: packageRow.priceCents / 100,
        packageSnapshot,
        packageCapacity: packageRow.capacity,
      };
    }

    if (dto.packageId) {
      throw new BadRequestException(
        packageErrorBody(
          FIXED_EVENT_PACKAGE_ERROR_CODES.PACKAGE_NOT_APPLICABLE,
          'This event does not use ticket packages.',
        ),
      );
    }

    const capacity = venueConfig.fixedTicketCapacity;
    if (capacity == null || capacity < 1) {
      throw new BadRequestException(
        'Ticket capacity is not configured for this event.',
      );
    }
    const remaining = await fixedTicketsRemaining(
      this.prisma,
      event.id,
      capacity,
    );
    if (remaining <= 0) {
      throw new ConflictException('Tickets sold out.');
    }
    if (event.price == null || Number(event.price) < 0.5) {
      throw new BadRequestException('Invalid event ticket price.');
    }
    return {
      event,
      venueConfig,
      amount: event.price,
      packageSnapshot: undefined,
      packageCapacity: undefined,
    };
  }

  private async sendPaidConfirmation(
    enrollment: {
      id: string;
      customerName: string;
      customerEmail: string;
      amount: Prisma.Decimal;
      currency: string;
      ticketNumber: number | null;
      packageTitle?: string | null;
      packageArrivalLabel?: string | null;
      packageInclusions?: unknown;
      event: { eventType: { name: string } };
    },
    venueConfig: {
      reservationEventDate: Date | null;
      reservationEventLabel: string | null;
    },
  ): Promise<boolean> {
    if (enrollment.ticketNumber == null) return false;
    const eventName = enrollment.event.eventType.name;
    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;
    const eventDateLabel =
      venueConfig.reservationEventLabel?.trim() ||
      (venueConfig.reservationEventDate
        ? venueConfig.reservationEventDate.toISOString()
        : 'See event details');
    const branding = emailBrandingFromProcessEnv();
    const pkgSnapshot = packageSnapshotFromEnrollment(enrollment);
    const { ok } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,
      toName: enrollment.customerName,
      subject: buildFixedTicketConfirmationSubject(eventName),
      text: buildFixedTicketConfirmationText({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        verificationCode: enrollment.id,
        siteBaseUrl: branding.siteBaseUrl,
        package: pkgSnapshot,
      }),
      html: buildFixedTicketConfirmationHtml({
        eventName,
        customerName: enrollment.customerName,
        ticketNumber: enrollment.ticketNumber,
        eventDateLabel,
        amount,
        verificationCode: enrollment.id,
        branding,
        package: pkgSnapshot,
      }),
    });
    return ok;
  }
}
