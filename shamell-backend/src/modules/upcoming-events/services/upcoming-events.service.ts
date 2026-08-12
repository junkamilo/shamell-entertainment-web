import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateClassCheckoutDto } from '../dto/create-class-checkout.dto';
import { CreateClassBundleCheckoutDto } from '../dto/create-class-bundle-checkout.dto';
import { CreateClassCartCheckoutDto } from '../dto/create-class-cart-checkout.dto';
import { CreateClassPackageCheckoutDto } from '../dto/create-class-package-checkout.dto';
import { AdminClassEnrollmentService } from './admin-class-enrollment.service';
import type { CreateAdminClassEnrollmentDto } from '../dto/create-admin-class-enrollment.dto';
import { CreateFixedEventCheckoutDto } from '../dto/create-fixed-event-checkout.dto';
import { UpsertClassSessionDto } from '../dto/upsert-class-session.dto';
import { UpsertVenueConfigDto } from '../dto/upsert-venue-config.dto';
import type { StripeWebhookEventLite } from '../../stripe/types/stripe-webhook.types';
import { UpcomingEventsPublicService } from './upcoming-events-public.service';
import { UpcomingEventsCheckoutService } from './upcoming-events-checkout.service';
import { UpcomingEventsWebhookService } from './upcoming-events-webhook.service';
import { UpcomingEventsAdminSessionsService } from './upcoming-events-admin-sessions.service';
import { UpcomingEventsVenueConfigService } from './upcoming-events-venue-config.service';

@Injectable()
export class UpcomingEventsService {
  constructor(
    private readonly publicService: UpcomingEventsPublicService,
    private readonly checkoutService: UpcomingEventsCheckoutService,
    private readonly webhookService: UpcomingEventsWebhookService,
    private readonly adminSessionsService: UpcomingEventsAdminSessionsService,
    private readonly venueConfigService: UpcomingEventsVenueConfigService,
    @Inject(forwardRef(() => AdminClassEnrollmentService))
    private readonly adminClassEnrollment: AdminClassEnrollmentService,
  ) {}

  getAdminClassBookingContext(eventId: string) {
    return this.adminClassEnrollment.getAdminClassBookingContext(eventId);
  }

  listAdminBookableClassEvents() {
    return this.adminClassEnrollment.listAdminBookableClassEvents();
  }

  createAdminClassCashEnrollment(
    adminUserId: string,
    dto: CreateAdminClassEnrollmentDto,
  ) {
    return this.adminClassEnrollment.createAdminClassCashEnrollment(
      adminUserId,
      dto,
    );
  }

  createAdminClassCheckoutSession(
    adminUserId: string,
    dto: CreateAdminClassEnrollmentDto,
  ) {
    return this.adminClassEnrollment.createAdminClassCheckoutSession(
      adminUserId,
      dto,
    );
  }

  resolveClassPayCheckoutClientSecret(token: string) {
    return this.adminClassEnrollment.resolveClassPayCheckoutClientSecret(token);
  }

  getPublicBySlug(slug: string) {
    return this.publicService.getPublicBySlug(slug);
  }

  listPublicSessions(slug: string) {
    return this.publicService.listPublicSessions(slug);
  }

  getPublicClassOptions(slug: string) {
    return this.publicService.getPublicClassOptions(slug);
  }

  getPublicVenueBundle(slug: string) {
    return this.publicService.getPublicVenueBundle(slug);
  }

  createClassCheckout(slug: string, dto: CreateClassCheckoutDto) {
    return this.checkoutService.createClassCheckout(slug, dto);
  }

  createClassBundleCheckout(slug: string, dto: CreateClassBundleCheckoutDto) {
    return this.checkoutService.createClassBundleCheckout(slug, dto);
  }

  createClassCartCheckout(slug: string, dto: CreateClassCartCheckoutDto) {
    return this.checkoutService.createClassCartCheckout(slug, dto);
  }

  createClassPackageCheckout(slug: string, dto: CreateClassPackageCheckoutDto) {
    return this.checkoutService.createClassPackageCheckout(slug, dto);
  }

  createFixedEventCheckout(slug: string, dto: CreateFixedEventCheckoutDto) {
    return this.checkoutService.createFixedEventCheckout(slug, dto);
  }

  getFixedEventSessionStatus(sessionId: string) {
    return this.webhookService.getFixedEventSessionStatus(sessionId);
  }

  reconcileFixedTicketFromStripeSession(
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
    return this.webhookService.reconcileFixedTicketFromStripeSession(
      sessionId,
      stripeSession,
    );
  }

  reconcileClassFromStripeSession(sessionId: string) {
    return this.webhookService.reconcileClassFromStripeSession(sessionId);
  }

  reconcileClassPackageFromStripeSession(
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
    return this.webhookService.reconcileClassPackageFromStripeSession(
      sessionId,
      stripeSession,
    );
  }

  reconcileClassSessionFromStripeSession(
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
    return this.webhookService.reconcileClassSessionFromStripeSession(
      sessionId,
      stripeSession,
    );
  }

  getClassSessionStatus(sessionId: string) {
    return this.webhookService.getClassSessionStatus(sessionId);
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */
  handleClassWebhook(rawBody: Buffer, signature: string | undefined) {
    return this.webhookService.handleClassWebhook(rawBody, signature);
  }

  processClassStripeWebhookEvent(event: StripeWebhookEventLite) {
    return this.webhookService.processClassStripeWebhookEvent(event);
  }

  processClassPackageStripeWebhookEvent(event: StripeWebhookEventLite) {
    return this.webhookService.processClassPackageStripeWebhookEvent(event);
  }

  /** @deprecated Use unified POST /api/v1/stripe/webhook dispatch */
  handleFixedEventTicketWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ) {
    return this.webhookService.handleFixedEventTicketWebhook(
      rawBody,
      signature,
    );
  }

  processFixedStripeWebhookEvent(event: StripeWebhookEventLite) {
    return this.webhookService.processFixedStripeWebhookEvent(event);
  }

  listAdminSessions(eventId: string) {
    return this.adminSessionsService.listAdminSessions(eventId);
  }

  createAdminSession(eventId: string, dto: UpsertClassSessionDto) {
    return this.adminSessionsService.createAdminSession(eventId, dto);
  }

  updateAdminSession(
    eventId: string,
    sessionId: string,
    dto: UpsertClassSessionDto,
  ) {
    return this.adminSessionsService.updateAdminSession(
      eventId,
      sessionId,
      dto,
    );
  }

  deleteAdminSession(eventId: string, sessionId: string) {
    return this.adminSessionsService.deleteAdminSession(eventId, sessionId);
  }

  regenerateAdminClassSessions(eventId: string) {
    return this.adminSessionsService.regenerateAdminClassSessions(eventId);
  }

  getAdminVenueConfig(eventId: string) {
    return this.venueConfigService.getAdminVenueConfig(eventId);
  }

  upsertAdminVenueConfig(eventId: string, dto: UpsertVenueConfigDto) {
    return this.venueConfigService.upsertAdminVenueConfig(eventId, dto);
  }

  resolveEventIdBySlug(slug: string): Promise<string> {
    return this.venueConfigService.resolveEventIdBySlug(slug);
  }

  getVenueConfigForEvent(eventId: string) {
    return this.venueConfigService.getVenueConfigForEvent(eventId);
  }
}
