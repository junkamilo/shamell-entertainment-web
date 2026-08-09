import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { ReservationEventTemplatesService } from '../../reservation-event-templates/services/reservation-event-templates.service';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { AdminClassEnrollmentService } from './admin-class-enrollment.service';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsService } from './upcoming-events.service';

describe('UpcomingEventsService', () => {
  let service: UpcomingEventsService;
  const repository = createUpcomingEventsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = { sendTransactional: jest.fn().mockResolvedValue({ ok: true }) };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const reservationTemplates = {};
  const adminClassEnrollment = {
    getAdminClassBookingContext: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({});
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsService,
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
      ],
    }).compile();
    service = moduleRef.get(UpcomingEventsService);
  });

  it('processClassStripeWebhookEvent ignores non class_session flow', async () => {
    await expect(
      service.processClassStripeWebhookEvent({
        id: 'evt_1',
        type: 'checkout.session.completed',
        livemode: false,
        data: {
          object: {
            id: 'cs_1',
            metadata: { flow: 'fixed_event_ticket' },
          },
        },
      }),
    ).resolves.toEqual({ handled: false });
  });
});
