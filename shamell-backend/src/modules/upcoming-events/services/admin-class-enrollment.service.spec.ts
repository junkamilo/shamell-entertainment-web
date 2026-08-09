import { BadRequestException } from '@nestjs/common';
import { UpcomingExperienceType } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { MailService } from '../../mail/services/mail.service';
import { AdminPaymentNotifyService } from '../../mail/services/admin-payment-notify.service';
import { StripeService } from '../../stripe/services/stripe.service';
import { createStripeServiceMock } from '../../stripe/__mocks__/stripe.service.mock';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { AdminClassEnrollmentService } from './admin-class-enrollment.service';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsService } from './upcoming-events.service';

describe('AdminClassEnrollmentService', () => {
  let service: AdminClassEnrollmentService;
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const mail = { sendTransactional: jest.fn() };
  const adminPaymentNotify = { notifyPaymentOutcome: jest.fn() };
  const upcomingEvents = {};

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminClassEnrollmentService,
        { provide: UpcomingEventsRepository, useValue: repository },
        { provide: StripeService, useValue: stripe },
        { provide: MailService, useValue: mail },
        { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
        { provide: UpcomingEventsService, useValue: upcomingEvents },
      ],
    }).compile();
    service = moduleRef.get(AdminClassEnrollmentService);
  });

  it('getAdminClassBookingContext rejects non-class events', async () => {
    prisma.event.findFirst.mockResolvedValue({
      id: 'event-1',
      slug: 'x',
      experienceType: UpcomingExperienceType.VENUE_SEATING,
    });
    await expect(
      service.getAdminClassBookingContext('event-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
