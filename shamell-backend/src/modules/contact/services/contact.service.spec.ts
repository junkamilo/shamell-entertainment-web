import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ContactRequestStatus } from '@prisma/client';
import { AvailabilityService } from '../../availability/services/availability.service';
import { BookingsService } from '../../bookings/services/bookings.service';
import { AdminCustomerActivityNotifyService } from '../../mail/services/admin-customer-activity-notify.service';
import { MailService } from '../../mail/services/mail.service';
import {
  makeContactRequestRow,
  makeCreateContactDto,
} from '../__mocks__/contact.fixtures';
import { createContactInboxServiceMock } from '../__mocks__/contact-inbox.service.mock';
import { createContactRepositoryMock } from '../__mocks__/contact.repository.mock';
import { ContactInboxService } from './contact-inbox.service';
import { ContactRepository } from './contact.repository';
import { ContactService } from './contact.service';

jest.mock('../../booking-inquiry/utils/booking-guide-investment.util', () => ({
  computeBookingGuideInvestmentUsd: jest.fn().mockResolvedValue({
    totalUsd: null,
    isPartial: false,
  }),
}));

describe('ContactService', () => {
  let service: ContactService;
  const repository = createContactRepositoryMock();
  const inbox = createContactInboxServiceMock();
  const availability = {
    bookingTimeZone: jest.fn().mockReturnValue('America/New_York'),
    assertDateTimeAllowed: jest.fn().mockResolvedValue(undefined),
  };
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: false }),
  };
  const adminActivityNotify = {
    notifyCustomerActivity: jest.fn().mockResolvedValue(undefined),
  };
  const config = { get: jest.fn().mockReturnValue(undefined) };
  const bookings = {
    preparePublicBookingInquiry: jest.fn(),
    insertPublicBookingInquiry: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({});
    repository.findOccasionTypeNamesByIds.mockResolvedValue([]);
    repository.findEventTypeNameById.mockResolvedValue(null);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: ContactRepository, useValue: repository },
        { provide: AvailabilityService, useValue: availability },
        { provide: MailService, useValue: mail },
        {
          provide: AdminCustomerActivityNotifyService,
          useValue: adminActivityNotify,
        },
        { provide: ConfigService, useValue: config },
        { provide: BookingsService, useValue: bookings },
        { provide: ContactInboxService, useValue: inbox },
      ],
    }).compile();
    service = moduleRef.get(ContactService);
  });

  it('create concierge path stores vision snapshot', async () => {
    const created = makeContactRequestRow({
      subject: 'Concierge inquiry',
      inquiryDetails: { entrySource: 'concierge_gate' },
    });
    repository.create.mockResolvedValue(created);

    const result = await service.create(
      makeCreateContactDto({
        subject: 'Concierge inquiry',
        inquiryDetails: { entrySource: 'concierge_gate' },
      }),
    );

    expect(result).toEqual(created);
    const createCalls = repository.create.mock.calls as Array<
      [
        {
          conciergeVisionSnapshot: { fullName: string; email: string };
        },
      ]
    >;
    expect(createCalls[0][0].conciergeVisionSnapshot.fullName).toBe(
      'Ada Lovelace',
    );
    expect(createCalls[0][0].conciergeVisionSnapshot.email).toBe(
      'ada@example.com',
    );
    expect(bookings.preparePublicBookingInquiry).not.toHaveBeenCalled();
  });

  it('create booking path prepares and inserts booking in a transaction', async () => {
    const reserved = makeContactRequestRow({
      id: 'c-book',
      status: ContactRequestStatus.RESERVED,
      isRead: true,
    });
    const txCreate = jest
      .fn()
      .mockResolvedValue(makeContactRequestRow({ id: 'c-book' }));
    const txUpdate = jest.fn().mockResolvedValue(reserved);
    repository.runTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          contactRequest: { create: txCreate, update: txUpdate },
        }),
    );
    bookings.preparePublicBookingInquiry.mockResolvedValue({
      prepared: true,
    });
    bookings.insertPublicBookingInquiry.mockResolvedValue(undefined);

    const result = await service.create(
      makeCreateContactDto({
        eventDate: '2026-09-15',
        email: 'ada@example.com',
        inquiryDetails: { entrySource: 'contact_page' },
      }),
    );

    expect(result.status).toBe(ContactRequestStatus.RESERVED);
    expect(bookings.preparePublicBookingInquiry).toHaveBeenCalled();
    expect(bookings.insertPublicBookingInquiry).toHaveBeenCalledWith(
      'c-book',
      { prepared: true },
      expect.objectContaining({ skipConfirmationEmail: true }),
    );
    expect(txUpdate).toHaveBeenCalled();
  });

  it('findOne throws 404 when missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('remove only allows CANCELLED rows', async () => {
    repository.findById.mockResolvedValue(makeContactRequestRow());
    await expect(service.remove('contact-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );

    repository.findById.mockResolvedValue(
      makeContactRequestRow({ status: ContactRequestStatus.CANCELLED }),
    );
    repository.delete.mockResolvedValue(
      makeContactRequestRow({ status: ContactRequestStatus.CANCELLED }),
    );
    await expect(service.remove('contact-1')).resolves.toMatchObject({
      status: ContactRequestStatus.CANCELLED,
    });
    expect(repository.delete).toHaveBeenCalledWith('contact-1');
  });

  it('countPeticionesBadge delegates to inbox', async () => {
    inbox.countPeticionesBadge.mockResolvedValue({ count: 4 });
    await expect(
      service.countPeticionesBadge({ lane: 'guidance' }),
    ).resolves.toEqual({ count: 4 });
  });
});
