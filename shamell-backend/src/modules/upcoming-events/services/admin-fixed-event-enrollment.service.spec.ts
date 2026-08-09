import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { AdminFixedEventEnrollmentService } from './admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from './upcoming-events.repository';

describe('AdminFixedEventEnrollmentService', () => {
  let service: AdminFixedEventEnrollmentService;
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const mail = { sendTransactional: jest.fn() };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminFixedEventEnrollmentService,
        { provide: UpcomingEventsRepository, useValue: repository },
        { provide: StripeService, useValue: stripe },
        { provide: MailService, useValue: mail },
        { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      ],
    }).compile();
    service = moduleRef.get(AdminFixedEventEnrollmentService);
  });

  it('createAdminCash rejects missing event', async () => {
    prisma.event.findFirst.mockResolvedValue(null);
    await expect(
      service.createAdminCash('admin-1', {
        upcomingEventId: 'missing',
        customerName: 'Guest',
        customerEmail: 'g@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
