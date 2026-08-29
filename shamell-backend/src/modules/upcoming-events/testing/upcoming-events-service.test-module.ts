import { Test, type TestingModule } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { ReservationEventTemplatesService } from '../../reservation-event-templates/services/reservation-event-templates.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../../stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import {
  UpcomingEventActivitiesService,
  UpcomingFixedEventPackagesService,
} from '../packages/upcoming-fixed-event-packages.service';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import { AdminClassEnrollmentService } from '../services/admin-class-enrollment.service';
import { UpcomingEventsRepository } from '../services/upcoming-events.repository';
import { UpcomingEventsService } from '../services/upcoming-events.service';
import { UpcomingEventsPublicService } from '../services/upcoming-events-public.service';
import { UpcomingEventsCheckoutService } from '../services/upcoming-events-checkout.service';
import { UpcomingEventsWebhookService } from '../services/upcoming-events-webhook.service';
import { UpcomingEventsAdminSessionsService } from '../services/upcoming-events-admin-sessions.service';
import { UpcomingEventsVenueConfigService } from '../services/upcoming-events-venue-config.service';

export type UpcomingEventsServiceTestHarness = {
  moduleRef: TestingModule;
  service: UpcomingEventsService;
  repository: ReturnType<typeof createUpcomingEventsRepositoryMock>;
  stripe: ReturnType<typeof createStripeServiceMock>;
  mail: { sendTransactional: jest.Mock };
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
  adminClassEnrollment: {
    getAdminClassBookingContext: jest.Mock;
    listAdminBookableClassEvents: jest.Mock;
    createAdminClassCashEnrollment: jest.Mock;
    createAdminClassCheckoutSession: jest.Mock;
    resolveClassPayCheckoutClientSecret: jest.Mock;
  };
  reservationTemplates: { findByIdOrThrow: jest.Mock };
};

export async function createUpcomingEventsServiceTestModule(): Promise<UpcomingEventsServiceTestHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const adminClassEnrollment = {
    getAdminClassBookingContext: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
    createAdminClassCashEnrollment: jest.fn(),
    createAdminClassCheckoutSession: jest.fn(),
    resolveClassPayCheckoutClientSecret: jest.fn(),
  };
  const reservationTemplates = {
    findByIdOrThrow: jest.fn(),
  };
  const packagesRepository = {
    findPackageById: jest.fn(),
    listPackagesByEvent: jest.fn().mockResolvedValue([]),
    listActiveActivitiesByEvent: jest.fn().mockResolvedValue([]),
    listActivitiesByEvent: jest.fn().mockResolvedValue([]),
    minActivePackagePriceCents: jest.fn().mockResolvedValue(null),
    countActivePackagesByEvent: jest.fn().mockResolvedValue(0),
  };
  const activitiesService = {
    listActivities: jest.fn(),
    replaceActivities: jest.fn(),
    uploadActivityMedia: jest.fn(),
    deleteActivityMedia: jest.fn(),
  };
  const packagesService = {
    listPackages: jest.fn(),
    createPackage: jest.fn(),
    updatePackage: jest.fn(),
    deletePackage: jest.fn(),
    reorderPackages: jest.fn(),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_test_created',
    client_secret: 'cs_test_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_test_created' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    providers: [
      UpcomingEventsService,
      UpcomingEventsPublicService,
      UpcomingEventsCheckoutService,
      UpcomingEventsWebhookService,
      UpcomingEventsAdminSessionsService,
      UpcomingEventsVenueConfigService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      {
        provide: ReservationEventTemplatesService,
        useValue: reservationTemplates,
      },
      {
        provide: AdminClassEnrollmentService,
        useValue: adminClassEnrollment,
      },
      {
        provide: UpcomingFixedEventPackagesRepository,
        useValue: packagesRepository,
      },
      {
        provide: UpcomingEventActivitiesService,
        useValue: activitiesService,
      },
      {
        provide: UpcomingFixedEventPackagesService,
        useValue: packagesService,
      },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(UpcomingEventsService),
    repository,
    stripe,
    mail,
    adminPaymentNotify,
    adminClassEnrollment,
    reservationTemplates,
  };
}
