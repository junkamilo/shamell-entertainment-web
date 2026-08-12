import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, UpcomingClassEnrollmentStatus } from '@prisma/client';

import { maskEmail } from '../../../common/util/mask-pii.util';

import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';

import { MailService } from '../../mail/services/mail.service';

import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';

import { fetchPaymentMethodDetails } from '../../stripe/utils/stripe-payment-details.util';

import { assertCheckoutPaidAmounts } from '../../stripe/utils/stripe-tax.util';

import { StripeService } from '../../stripe/services/stripe.service';

import { UpcomingEventsRepository } from './upcoming-events.repository';

import {
  parseCheckoutSession,
  paymentIntentIdFromSession,
  type StripeCheckoutSessionLite,
  type StripeWebhookEventLite,
} from '../../stripe/types/stripe-webhook.types';

import { emailBrandingFromProcessEnv } from '../../mail/utils/email-html-branding';

import {
  buildClassBundleConfirmationHtml,
  buildClassBundleConfirmationSubject,
  buildClassBundleConfirmationText,
} from '../mail/class-bundle-confirmation.mail';

import {
  buildClassEnrollmentConfirmationHtml,
  buildClassEnrollmentConfirmationSubject,
  buildClassEnrollmentConfirmationText,
} from '../mail/class-enrollment-confirmation.mail';

import { formatEnrollmentReference } from '../utils/enrollment-reference.util';

import {
  sessionCalendarDateIso,
  sessionLabel as formatSessionLabel,
} from '../utils/upcoming-events-mapper.util';

import {
  buildFixedTicketConfirmationHtml,
  buildFixedTicketConfirmationSubject,
  buildFixedTicketConfirmationText,
} from '../mail/fixed-ticket-confirmation.mail';

@Injectable()
export class UpcomingEventsWebhookService {
  private readonly logger = new Logger(UpcomingEventsWebhookService.name);

  constructor(
    private readonly repository: UpcomingEventsRepository,

    private readonly stripeService: StripeService,

    private readonly mail: MailService,

    private readonly adminPaymentNotify: AdminPaymentNotifyService,
  ) {}

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */

  async handleClassWebhook(rawBody: Buffer, signature: string | undefined) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,

      signature,

      this.stripeService.webhookSecret,
    ) as StripeWebhookEventLite;

    return this.processClassStripeWebhookEvent(event);
  }

  async processClassStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;

    if (sessionObj?.metadata?.flow !== 'class_session') {
      return { handled: false };
    }

    if (event.type === 'checkout.session.completed') {
      await this.markEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();

      if (sid) await this.markEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }

    return { handled: true };
  }

  async processClassPackageStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;

    const flow = sessionObj?.metadata?.flow;

    if (
      !sessionObj ||
      (flow !== 'class_package' &&
        flow !== 'class_session_bundle' &&
        flow !== 'class_session_cart' &&
        flow !== 'class_month_package')
    ) {
      return { handled: false };
    }

    if (event.type === 'checkout.session.completed') {
      await this.markPackageEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();

      if (sid) await this.markPackageEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }

    return { handled: true };
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */

  async handleFixedEventTicketWebhook(
    rawBody: Buffer,

    signature: string | undefined,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header.');
    }

    const event = this.stripeService.client.webhooks.constructEvent(
      rawBody,

      signature,

      this.stripeService.webhookSecret,
    ) as StripeWebhookEventLite;

    return this.processFixedStripeWebhookEvent(event);
  }

  async processFixedStripeWebhookEvent(
    event: StripeWebhookEventLite,
  ): Promise<{ handled: boolean }> {
    const sessionObj =
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.expired'
        ? parseCheckoutSession(event.data.object)
        : null;

    if (sessionObj?.metadata?.flow !== 'fixed_event_ticket') {
      return { handled: false };
    }

    if (event.type === 'checkout.session.completed') {
      await this.markFixedEnrollmentPaid(sessionObj, event.id);
    } else if (event.type === 'checkout.session.expired') {
      const sid = sessionObj.id?.trim();

      if (sid) await this.markFixedEnrollmentExpired(sid);
    } else {
      return { handled: false };
    }

    return { handled: true };
  }

  async getFixedEventSessionStatus(sessionId: string): Promise<{
    stripeStatus: string | null;

    enrollment: {
      status: UpcomingClassEnrollmentStatus;

      customerEmail: string | null;

      eventName: string;

      eventSlug: string | null;

      ticketNumber?: number;
    };
  }> {
    const enrollment =
      await this.repository.findFixedEnrollmentForCheckoutSession(sessionId);

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found.');
    }

    const stripeSession =
      await this.stripeService.client.checkout.sessions.retrieve(sessionId);

    if (
      stripeSession.status === 'complete' &&
      stripeSession.payment_status === 'paid' &&
      enrollment.status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT
    ) {
      try {
        await this.reconcileFixedTicketFromStripeSession(
          sessionId,

          stripeSession,
        );
      } catch (err) {
        logCaughtError(this.logger, err, {
          op: 'upcoming.fixed_ticket_reconcile',

          level: 'warn',

          extra: { sessionId },
        });
      }
    }

    const refreshed =
      (await this.repository.findFixedEnrollmentForCheckoutSession(
        sessionId,
      )) ?? enrollment;

    return {
      stripeStatus: stripeSession.status ?? null,

      enrollment: {
        status: refreshed.status,

        customerEmail: maskEmail(refreshed.customerEmail),

        eventName: refreshed.event.eventType.name,

        eventSlug: refreshed.event.slug,

        ...(refreshed.ticketNumber != null
          ? { ticketNumber: refreshed.ticketNumber }
          : {}),
      },
    };
  }

  async reconcileFixedTicketFromStripeSession(
    sessionId: string,

    stripeSession?: {
      status: string | null;

      payment_status: string | null;

      metadata?: Record<string, string> | null;

      id?: string;

      payment_intent?: unknown;

      amount_total?: number | null;
    },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    const sessionLite = parseCheckoutSession(session);

    if (sessionLite.metadata?.flow !== 'fixed_event_ticket') {
      throw new BadRequestException('Not a fixed ticket checkout session.');
    }

    await this.markFixedEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);

    return { reconciled: true };
  }

  async reconcileClassFromStripeSession(sessionId: string) {
    const trimmed = sessionId.trim();

    const pkg =
      await this.repository.findPackageEnrollmentByCheckoutSessionId(trimmed);

    if (pkg) {
      return this.reconcileClassPackageFromStripeSession(trimmed);
    }

    return this.reconcileClassSessionFromStripeSession(trimmed);
  }

  async reconcileClassPackageFromStripeSession(
    sessionId: string,

    stripeSession?: {
      status: string | null;

      payment_status: string | null;

      metadata?: Record<string, string> | null;

      id?: string;

      payment_intent?: unknown;

      amount_total?: number | null;
    },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    const sessionLite = parseCheckoutSession(session);

    await this.markPackageEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);

    return { reconciled: true };
  }

  async reconcileClassSessionFromStripeSession(
    sessionId: string,

    stripeSession?: {
      status: string | null;

      payment_status: string | null;

      metadata?: Record<string, string> | null;

      id?: string;

      payment_intent?: unknown;

      amount_total?: number | null;
    },
  ) {
    const session =
      stripeSession ??
      (await this.stripeService.client.checkout.sessions.retrieve(sessionId));

    if (session.status !== 'complete' || session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    const sessionLite = parseCheckoutSession(session);

    await this.markEnrollmentPaid(sessionLite, `reconcile:${sessionId}`);

    return { reconciled: true };
  }

  async getClassSessionStatus(sessionId: string) {
    const packageEnrollment =
      await this.repository.findPackageEnrollmentForCheckoutSession(sessionId);

    if (packageEnrollment) {
      let stripeStatus: 'complete' | 'open' | 'expired' = 'open';

      let checkoutFlow: string | undefined;

      try {
        const stripeSession =
          await this.stripeService.client.checkout.sessions.retrieve(sessionId);

        if (stripeSession.status === 'complete') stripeStatus = 'complete';
        else if (stripeSession.status === 'expired') stripeStatus = 'expired';

        checkoutFlow = stripeSession.metadata?.flow ?? undefined;

        if (
          stripeSession.status === 'complete' &&
          stripeSession.payment_status === 'paid' &&
          packageEnrollment.status ===
            UpcomingClassEnrollmentStatus.PENDING_PAYMENT
        ) {
          try {
            await this.reconcileClassPackageFromStripeSession(
              sessionId,

              stripeSession,
            );
          } catch (err) {
            logCaughtError(this.logger, err, {
              op: 'upcoming.class_package_reconcile',

              level: 'warn',

              extra: { sessionId },
            });
          }
        }
      } catch {
        throw new NotFoundException('Checkout session not found.');
      }

      const refreshed =
        (await this.repository.findPackageEnrollmentForCheckoutSession(
          sessionId,
        )) ?? packageEnrollment;

      const purchaseKind =
        checkoutFlow === 'class_session_bundle'
          ? 'day_bundle'
          : checkoutFlow === 'class_session_cart'
            ? 'session_cart'
            : 'package';

      return {
        stripeStatus,

        package: true,

        purchaseKind,

        enrollment: {
          status: refreshed.status,

          customerEmail: maskEmail(refreshed.customerEmail),

          eventName: refreshed.event.eventType.name,

          eventSlug: refreshed.event.slug,

          sessions: refreshed.items.map((item) => ({
            weekday: item.weekday,

            sessionLabel: formatSessionLabel(item.enrollment.session),

            confirmationReference: formatEnrollmentReference(
              item.enrollment.id,
            ),
          })),
        },
      };
    }

    const enrollment =
      await this.repository.findClassEnrollmentForCheckoutSession(sessionId);

    if (!enrollment) throw new NotFoundException('Enrollment not found.');

    let stripeStatus: 'complete' | 'open' | 'expired' = 'open';

    try {
      const stripeSession =
        await this.stripeService.client.checkout.sessions.retrieve(sessionId);

      if (stripeSession.status === 'complete') stripeStatus = 'complete';
      else if (stripeSession.status === 'expired') stripeStatus = 'expired';

      if (
        stripeSession.status === 'complete' &&
        stripeSession.payment_status === 'paid' &&
        enrollment.status === UpcomingClassEnrollmentStatus.PENDING_PAYMENT
      ) {
        try {
          await this.reconcileClassSessionFromStripeSession(
            sessionId,

            stripeSession,
          );
        } catch (err) {
          logCaughtError(this.logger, err, {
            op: 'upcoming.class_reconcile',

            level: 'warn',

            extra: { sessionId },
          });
        }
      }
    } catch {
      throw new NotFoundException('Checkout session not found.');
    }

    const refreshed =
      (await this.repository.findClassEnrollmentForCheckoutSession(
        sessionId,
      )) ?? enrollment;

    return {
      stripeStatus,

      enrollment: {
        id: refreshed.id,

        status: refreshed.status,

        customerEmail: maskEmail(refreshed.customerEmail),

        sessionLabel: formatSessionLabel(refreshed.session),

        confirmationReference: formatEnrollmentReference(refreshed.id),

        eventName: refreshed.session.event.eventType.name,

        eventSlug: refreshed.session.event.slug,
      },
    };
  }

  private async markEnrollmentPaid(
    session: StripeCheckoutSessionLite,

    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();

    if (!sessionId) throw new BadRequestException('Invalid session id.');

    const enrollment =
      await this.repository.findClassEnrollmentForCheckoutSession(sessionId);

    if (!enrollment) {
      this.logger.warn(`class-webhook-missing enrollment session=${sessionId}`);

      throw new NotFoundException(
        'Class enrollment not found for checkout session.',
      );
    }

    if (enrollment.status === UpcomingClassEnrollmentStatus.PAID) return;

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(enrollment.amount) * 100),

      expectedCurrency: enrollment.currency,

      sessionLabel: sessionId,
    });

    const paymentIntent = session.payment_intent;

    const paymentIntentId =
      typeof paymentIntent === 'string'
        ? paymentIntent
        : (paymentIntent?.id ?? null);

    await this.repository.markClassEnrollmentPaid(enrollment.id, {
      paymentIntentId,
    });

    this.logger.log(
      `class-enrollment-paid id=${enrollment.id} stripeEvent=${stripeEventId}`,
    );

    if (!enrollment.customerEmailSentAt) {
      const sent = await this.sendClassConfirmation(enrollment);

      if (sent) {
        await this.repository.stampClassEnrollmentEmailSent(enrollment.id);
      }
    }

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',

      flow: 'CLASS_SESSION',

      customerName: enrollment.customerName,

      customerEmail: enrollment.customerEmail,

      amount: Number(enrollment.amount),

      currency: enrollment.currency,

      contextLabel: enrollment.session.event.eventType.name,

      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async markEnrollmentExpired(sessionId: string) {
    const enrollment =
      await this.repository.findClassEnrollmentForExpire(sessionId);

    if (!enrollment) return;

    if (enrollment.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT)
      return;

    await this.repository.markClassEnrollmentExpired(enrollment.id);

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',

      flow: 'CLASS_SESSION',

      customerName: enrollment.customerName,

      customerEmail: enrollment.customerEmail,

      amount: Number(enrollment.amount),

      currency: enrollment.currency,

      contextLabel: enrollment.session.event.eventType.name,

      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async markFixedEnrollmentPaid(
    session: StripeCheckoutSessionLite,

    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();

    if (!sessionId) throw new BadRequestException('Invalid session id.');

    const enrollment =
      await this.repository.findFixedEnrollmentForCheckoutSession(sessionId);

    if (!enrollment) {
      throw new NotFoundException(
        `Fixed ticket enrollment not found for session ${sessionId}.`,
      );
    }

    if (enrollment.status === UpcomingClassEnrollmentStatus.PAID) {
      await this.sendFixedTicketPostPaymentNotifications(
        enrollment.id,

        stripeEventId,
      );

      return;
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(enrollment.amount) * 100),

      expectedCurrency: enrollment.currency,

      sessionLabel: sessionId,
    });

    const paymentIntentId = paymentIntentIdFromSession(session);

    const paymentDetails = await fetchPaymentMethodDetails(
      this.stripeService.client,

      session,
    );

    const venueConfig = await this.repository.findVenueConfigByEventId(
      enrollment.eventId,
    );

    let paidEnrollment:
      | (typeof enrollment & { ticketNumber: number | null })
      | null = null;

    try {
      paidEnrollment = await this.repository.finalizeFixedEnrollmentPayment(
        enrollment,

        {
          paymentIntentId,

          paymentMethodType: paymentDetails.paymentMethodType,

          paymentMethodBrand: paymentDetails.paymentMethodBrand,

          paymentMethodLast4: paymentDetails.paymentMethodLast4,

          fixedTicketCapacity: venueConfig?.fixedTicketCapacity ?? null,
        },
      );
    } catch (err) {
      if (err instanceof ConflictException) {
        await this.repository.markFixedEnrollmentPaidWithoutTicket(
          enrollment.id,

          {
            paymentIntentId,

            paymentMethodType: paymentDetails.paymentMethodType,

            paymentMethodBrand: paymentDetails.paymentMethodBrand,

            paymentMethodLast4: paymentDetails.paymentMethodLast4,
          },
        );

        this.logger.error(
          `fixed-ticket-sold-out-after-payment enrollment=${enrollment.id} session=${sessionId} stripeEvent=${stripeEventId}`,
        );

        await this.adminPaymentNotify.notifyPaymentOutcome({
          outcome: 'PAID',

          flow: 'FIXED_TICKET',

          customerName: enrollment.customerName,

          customerEmail: enrollment.customerEmail,

          amount: Number(enrollment.amount),

          currency: enrollment.currency,

          contextLabel: `${enrollment.event.eventType.name} ? PAID but ticket # not assigned (sold out)`,

          reference: enrollment.id.slice(0, 8).toUpperCase(),
        });

        throw new InternalServerErrorException(
          'Payment received but ticket assignment failed. Support will contact you.',
        );
      }

      throw err;
    }

    const afterPay = await this.repository.findFixedEnrollmentRecordById(
      enrollment.id,
    );

    if (afterPay?.status !== UpcomingClassEnrollmentStatus.PAID) {
      throw new InternalServerErrorException(
        'Could not finalize fixed ticket enrollment after payment.',
      );
    }

    this.logger.log(
      `fixed-event-enrollment-paid id=${enrollment.id} ticket=${paidEnrollment?.ticketNumber ?? 'pending'} stripeEvent=${stripeEventId}`,
    );

    await this.sendFixedTicketPostPaymentNotifications(
      enrollment.id,

      stripeEventId,
    );
  }

  private async sendFixedTicketPostPaymentNotifications(
    enrollmentId: string,

    stripeEventId: string,
  ) {
    const enrollment =
      await this.repository.findFixedEnrollmentById(enrollmentId);

    if (
      !enrollment ||
      enrollment.status !== UpcomingClassEnrollmentStatus.PAID
    ) {
      return;
    }

    const venueConfig = await this.repository.findVenueConfigByEventId(
      enrollment.eventId,
    );

    if (enrollment.ticketNumber != null && !enrollment.customerEmailSentAt) {
      const sent = await this.sendFixedTicketConfirmation(
        { ...enrollment, ticketNumber: enrollment.ticketNumber },

        venueConfig,
      );

      if (sent) {
        await this.repository.stampFixedEnrollmentEmailSent(enrollmentId);
      }
    }

    if (!enrollment.adminNotifySentAt) {
      await this.adminPaymentNotify.notifyPaymentOutcome({
        outcome: 'PAID',

        flow: 'FIXED_TICKET',

        customerName: enrollment.customerName,

        customerEmail: enrollment.customerEmail,

        amount: Number(enrollment.amount),

        currency: enrollment.currency,

        contextLabel: `${enrollment.event.eventType.name}${enrollment.ticketNumber != null ? ` ? Ticket #${enrollment.ticketNumber}` : ''}`,

        reference: enrollment.id.slice(0, 8).toUpperCase(),
      });

      await this.repository.stampFixedEnrollmentAdminNotifySent(enrollmentId);
    }

    this.logger.log(
      `fixed-ticket-notifications enrollment=${enrollmentId} stripeEvent=${stripeEventId}`,
    );
  }

  private async markFixedEnrollmentExpired(sessionId: string) {
    const enrollment =
      await this.repository.findFixedEnrollmentForCheckoutSession(sessionId);

    if (!enrollment) return;

    if (enrollment.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT)
      return;

    await this.repository.markFixedEnrollmentExpired(enrollment.id);

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'EXPIRED',

      flow: 'FIXED_TICKET',

      customerName: enrollment.customerName,

      customerEmail: enrollment.customerEmail,

      amount: Number(enrollment.amount),

      currency: enrollment.currency,

      contextLabel: enrollment.event.eventType.name,

      reference: enrollment.id.slice(0, 8).toUpperCase(),
    });
  }

  private async sendFixedTicketConfirmation(
    enrollment: {
      customerName: string;

      customerEmail: string;

      amount: Prisma.Decimal;

      currency: string;

      ticketNumber: number;

      event: { eventType: { name: string } };
    },

    venueConfig: {
      reservationEventDate: Date | null;

      reservationEventLabel: string | null;
    } | null,
  ): Promise<boolean> {
    const eventName = enrollment.event.eventType.name;

    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;

    const eventDateLabel =
      venueConfig?.reservationEventLabel?.trim() ||
      (venueConfig?.reservationEventDate
        ? venueConfig.reservationEventDate.toISOString()
        : 'See event details');

    const branding = emailBrandingFromProcessEnv();

    const { ok, errorText } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,

      toName: enrollment.customerName,

      subject: buildFixedTicketConfirmationSubject(eventName),

      text: buildFixedTicketConfirmationText({
        eventName,

        customerName: enrollment.customerName,

        ticketNumber: enrollment.ticketNumber,

        eventDateLabel,

        amount,

        siteBaseUrl: branding.siteBaseUrl,
      }),

      html: buildFixedTicketConfirmationHtml({
        eventName,

        customerName: enrollment.customerName,

        ticketNumber: enrollment.ticketNumber,

        eventDateLabel,

        amount,

        branding,
      }),
    });

    if (!ok) {
      this.logger.warn(
        `fixed-ticket-email-failed to=${enrollment.customerEmail} reason=${errorText ?? 'unknown'}`,
      );

      return false;
    }

    this.logger.log(`fixed-ticket-email-sent to=${enrollment.customerEmail}`);

    return true;
  }

  private async sendClassConfirmation(enrollment: {
    id: string;

    customerName: string;

    customerEmail: string;

    amount: Prisma.Decimal;

    currency: string;

    session: {
      startsAt: Date;

      endsAt: Date;

      timezone: string;

      section?: {
        label: string | null;

        startTime: string;

        endTime: string;
      } | null;

      event: { eventType: { name: string } };
    };
  }) {
    const eventName = enrollment.session.event.eventType.name;

    const amount = `${Number(enrollment.amount).toFixed(2)} ${enrollment.currency.toUpperCase()}`;

    const sessionLabel = formatSessionLabel(enrollment.session);

    const confirmationReference = formatEnrollmentReference(enrollment.id);

    const branding = emailBrandingFromProcessEnv();

    const { ok, errorText } = await this.mail.sendTransactional({
      to: enrollment.customerEmail,

      toName: enrollment.customerName,

      subject: buildClassEnrollmentConfirmationSubject(eventName),

      text: buildClassEnrollmentConfirmationText({
        eventName,

        customerName: enrollment.customerName,

        sessionLabel,

        amount,

        confirmationReference,

        siteBaseUrl: branding.siteBaseUrl,
      }),

      html: buildClassEnrollmentConfirmationHtml({
        eventName,

        customerName: enrollment.customerName,

        sessionLabel,

        amount,

        confirmationReference,

        branding,
      }),
    });

    if (!ok) {
      this.logger.warn(
        `class-confirmation-email-failed to=${enrollment.customerEmail} reason=${errorText ?? 'unknown'}`,
      );

      return false;
    }

    this.logger.log(
      `class-confirmation-email-sent to=${enrollment.customerEmail}`,
    );

    return true;
  }

  private async sendClassBundleConfirmation(
    pkg: {
      customerName: string;

      customerEmail: string;

      amount: Prisma.Decimal;

      currency: string;

      event: { eventType: { name: string } };

      items: Array<{
        enrollment: {
          id: string;

          amount: Prisma.Decimal;

          currency: string;

          session: {
            startsAt: Date;

            endsAt: Date;

            timezone: string;

            section?: {
              label: string | null;

              startTime: string;

              endTime: string;
            } | null;

            event: { eventType: { name: string } };
          };
        };
      }>;
    },

    checkoutFlow: string | undefined,
  ) {
    const eventName = pkg.event.eventType.name;

    const totalAmount = `${Number(pkg.amount).toFixed(2)} ${pkg.currency.toUpperCase()}`;

    const firstSession = pkg.items[0]?.enrollment.session;

    const dateLabel = firstSession
      ? sessionCalendarDateIso(
          firstSession.startsAt,

          firstSession.timezone,
        )
      : 'your scheduled date';

    const lines = pkg.items.map((item) => ({
      sessionLabel: formatSessionLabel(item.enrollment.session),

      amount: `${Number(item.enrollment.amount).toFixed(2)} ${item.enrollment.currency.toUpperCase()}`,

      confirmationReference: formatEnrollmentReference(item.enrollment.id),
    }));

    const branding = emailBrandingFromProcessEnv();

    const { ok, errorText } = await this.mail.sendTransactional({
      to: pkg.customerEmail,

      toName: pkg.customerName,

      subject: buildClassBundleConfirmationSubject(eventName, pkg.items.length),

      text: buildClassBundleConfirmationText({
        eventName,

        customerName: pkg.customerName,

        dateLabel,

        totalAmount,

        lines,

        siteBaseUrl: branding.siteBaseUrl,
      }),

      html: buildClassBundleConfirmationHtml({
        eventName,

        customerName: pkg.customerName,

        dateLabel,

        totalAmount,

        lines,

        branding,
      }),
    });

    if (!ok) {
      this.logger.warn(
        `class-bundle-email-failed flow=${checkoutFlow ?? 'package'} to=${pkg.customerEmail} reason=${errorText ?? 'unknown'}`,
      );

      return false;
    }

    this.logger.log(
      `class-bundle-email-sent flow=${checkoutFlow ?? 'package'} to=${pkg.customerEmail} sections=${pkg.items.length}`,
    );

    return true;
  }

  private async markPackageEnrollmentPaid(
    session: StripeCheckoutSessionLite,

    stripeEventId: string,
  ) {
    const sessionId = session.id?.trim();

    if (!sessionId) throw new BadRequestException('Invalid session id.');

    const pkg =
      await this.repository.findPackageEnrollmentForCheckoutSession(sessionId);

    if (!pkg) {
      this.logger.warn(
        `class-package-webhook-missing package session=${sessionId}`,
      );

      throw new NotFoundException(
        'Class package enrollment not found for checkout session.',
      );
    }

    if (pkg.status === UpcomingClassEnrollmentStatus.PAID) return;

    if (session.payment_status !== 'paid') {
      throw new BadRequestException('Checkout session is not paid.');
    }

    assertCheckoutPaidAmounts(session, {
      expectedSubtotalCents: Math.round(Number(pkg.amount) * 100),

      expectedCurrency: pkg.currency,

      sessionLabel: sessionId,
    });

    const checkoutFlow = session.metadata?.flow;

    const isDayBundle = checkoutFlow === 'class_session_bundle';
    const isSessionCart = checkoutFlow === 'class_session_cart';

    await this.repository.markPackageEnrollmentPaid(pkg.id);

    for (const item of pkg.items) {
      await this.repository.markPackageChildEnrollmentPaid(item.enrollmentId);
    }

    const refreshed =
      (await this.repository.findPackageEnrollmentById(pkg.id)) ?? pkg;

    const emailPkg = refreshed;

    if (!emailPkg.customerEmailSentAt) {
      let sent = false;

      if (emailPkg.items.length === 1) {
        sent = await this.sendClassConfirmation(emailPkg.items[0].enrollment);
      } else {
        sent = await this.sendClassBundleConfirmation(emailPkg, checkoutFlow);
      }

      if (sent) {
        await this.repository.stampPackageEnrollmentEmailSent(emailPkg.id);
      }
    }

    const firstSession = emailPkg.items[0]?.enrollment.session;

    const bundleDate =
      isDayBundle && firstSession
        ? sessionCalendarDateIso(
            firstSession.startsAt,

            firstSession.timezone,
          )
        : null;

    const contextLabel =
      isDayBundle && bundleDate
        ? `${emailPkg.event.eventType.name} — ${emailPkg.items.length} section(s) on ${bundleDate}`
        : isSessionCart
          ? `${emailPkg.event.eventType.name} — ${emailPkg.items.length} class${emailPkg.items.length === 1 ? '' : 'es'}`
          : `${emailPkg.event.eventType.name} — class package (${emailPkg.items.length} days)`;

    await this.adminPaymentNotify.notifyPaymentOutcome({
      outcome: 'PAID',

      flow: isDayBundle
        ? 'CLASS_DAY_BUNDLE'
        : isSessionCart
          ? 'CLASS_SESSION_CART'
          : 'CLASS_PACKAGE',

      customerName: emailPkg.customerName,

      customerEmail: emailPkg.customerEmail,

      amount: Number(emailPkg.amount),

      currency: emailPkg.currency,

      contextLabel,

      reference: emailPkg.id.slice(0, 8).toUpperCase(),
    });

    this.logger.log(
      `class-package-paid id=${emailPkg.id} flow=${checkoutFlow ?? 'class_package'} stripeEvent=${stripeEventId}`,
    );
  }

  private async markPackageEnrollmentExpired(sessionId: string) {
    const pkg = await this.repository.findPackageEnrollmentForExpire(sessionId);

    if (!pkg) return;

    if (pkg.status !== UpcomingClassEnrollmentStatus.PENDING_PAYMENT) return;

    await this.repository.markPackageEnrollmentExpired(
      pkg.id,

      pkg.items.map((item) => item.enrollmentId),
    );
  }
}
