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
  BookingStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  maskCustomerName,
  maskEmail,
} from '../../../common/util/mask-pii.util';
import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';
import { emailBrandingFromConfig } from '../../mail/utils/email-html-branding';
import { MailService } from '../../mail/services/mail.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { STRIPE_EMBEDDED_CHECKOUT_BASE } from '../../stripe/utils/stripe-embedded-checkout.util';
import {
  stripeAutomaticTaxParams,
  stripeTaxProductData,
} from '../../stripe/utils/stripe-tax.util';
import { StripeService } from '../../stripe/services/stripe.service';
import { BookingsAdminService } from './bookings-admin.service';
import { BookingsWebhookService } from './bookings-webhook.service';
import { BookingsRepository } from './bookings.repository';
import { CreateBookingQuoteDto } from '../dto/create-booking-quote.dto';
import { SendBookingBalanceLinkDto } from '../dto/send-booking-balance-link.dto';
import {
  CHECKOUT_TTL_MINUTES,
  QUOTE_TOKEN_TTL_HOURS,
} from '../constants/bookings.constants';
import {
  buildBookingBalanceLinkHtml,
  buildBookingBalanceLinkSubject,
  buildBookingBalanceLinkText,
  buildBookingQuoteHtml,
  buildBookingQuoteSubject,
  buildBookingQuoteText,
} from '../mail/booking-quote.mail';
import {
  buildQuotePayUrl,
  hashQuoteToken,
  isBookingFullyPaid,
} from '../utils/booking-quote.util';

@Injectable()
export class BookingsQuoteService {
  private readonly logger = new Logger(BookingsQuoteService.name);

  constructor(
    private readonly repository: BookingsRepository,
    private readonly mail: MailService,
    private readonly adminActivityNotify: AdminCustomerActivityNotifyService,
    private readonly config: ConfigService,
    private readonly stripeService: StripeService,
    private readonly admin: BookingsAdminService,
    private readonly webhook: BookingsWebhookService,
  ) {}

  private emailBrandingForTemplates() {
    return emailBrandingFromConfig(this.config);
  }

  async createBookingQuote(
    adminUserId: string,
    bookingId: string,
    dto: CreateBookingQuoteDto,
  ) {
    const booking = await this.admin.findOneAdmin(bookingId);
    if (isBookingFullyPaid(booking)) {
      throw new BadRequestException(
        'This booking is already fully paid. A new payment link cannot be sent.',
      );
    }
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
    const tokenHash = hashQuoteToken(rawToken);
    const tokenExpiresAt = new Date(
      Date.now() + QUOTE_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.repository.cancelPendingBookingPayments(booking.id);

    const quote = await this.repository.createBookingQuote({
      bookingId: booking.id,
      paymentModel: dto.paymentModel,
      totalAmount: total,
      depositAmount:
        dto.paymentModel === BookingQuotePaymentModel.DEPOSIT ? deposit : null,
      balanceAmount:
        dto.paymentModel === BookingQuotePaymentModel.DEPOSIT ? balance : null,
      currency,
      tokenHash,
      tokenExpiresAt,
    });

    await this.repository.updateBooking(booking.id, {
      status: BookingStatus.PENDING,
      quoteModel: dto.paymentModel,
      quoteTotalAmount: total,
      quoteDepositAmount:
        dto.paymentModel === BookingQuotePaymentModel.DEPOSIT ? deposit : null,
      quoteBalanceAmount:
        dto.paymentModel === BookingQuotePaymentModel.DEPOSIT ? balance : null,
      quoteCurrency: currency,
      quoteSentAt: new Date(),
      quoteAcceptedAt: null,
      quoteRejectedAt: null,
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
    const payUrl = buildQuotePayUrl(this.stripeService.frontendUrl(), rawToken);
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
        contextLabel: this.admin.bookingContextLabel(booking),
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
    const booking = await this.admin.findOneAdmin(bookingId);
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

    const activeQuote =
      await this.repository.findActiveQuoteByBookingId(bookingId);
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
    await this.repository.updateBookingQuote(activeQuote.id, {
      tokenHash: hashQuoteToken(rawToken),
      tokenExpiresAt: new Date(
        Date.now() + QUOTE_TOKEN_TTL_HOURS * 60 * 60 * 1000,
      ),
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

    await this.repository.cancelOtherPendingBalancePayments(
      bookingId,
      payment.id,
    );

    const payUrl = buildQuotePayUrl(this.stripeService.frontendUrl(), rawToken);
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
        contextLabel: this.admin.bookingContextLabel(booking),
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
    return buildQuotePayUrl(this.stripeService.frontendUrl(), token);
  }

  async resolveQuoteCheckoutClientSecret(token: string): Promise<string> {
    const quote = await this.findActiveQuoteByToken(token);
    const booking = await this.repository.findBookingWithUser(quote.bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }

    let payment = await this.repository.findPendingPaymentByQuoteId(quote.id);
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
        await this.repository.updateBookingPayment(payment.id, {
          status: BookingPaymentStatus.EXPIRED,
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
    const payment =
      await this.repository.findPaymentByCheckoutSessionId(sessionId);
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
        await this.webhook.markBookingPaymentPaid(
          'return-page-reconcile',
          this.webhook.parseStripeCheckoutSession(stripeSession),
        );
      } catch (err) {
        logCaughtError(this.logger, err, {
          op: 'booking.reconcile_on_status',
          level: 'warn',
          extra: { sessionId },
        });
      }
    }

    const refreshed =
      await this.repository.findPaymentByCheckoutSessionId(sessionId);
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
      ...STRIPE_EMBEDDED_CHECKOUT_BASE,
      mode: 'payment' as const,
      customer_email: args.customerEmail,
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
    return this.repository.createBookingPayment({
      bookingId: args.bookingId,
      quoteId: args.quoteId,
      stage: args.stage,
      expectedAmount: args.amount,
      currency: args.currency,
      stripeCheckoutSessionId: session.id,
      expiresAt,
    });
  }

  private async findActiveQuoteByToken(rawToken: string) {
    const tokenHash = hashQuoteToken(rawToken);
    const quote = await this.repository.findActiveQuoteByTokenHash(tokenHash);
    if (!quote) throw new NotFoundException('Quote not found.');
    if (quote.tokenExpiresAt.getTime() < Date.now()) {
      await this.repository.updateBookingQuote(quote.id, {
        status: BookingQuoteStatus.EXPIRED,
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
}
