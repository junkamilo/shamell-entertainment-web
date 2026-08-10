import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import {
  makeContactRequestRow,
  makeCreateContactDto,
} from '../__mocks__/contact.fixtures';
import { createContactServiceTestModule } from '../testing/contact-service.test-module';
import type { ContactService } from './contact.service';

jest.mock('../../booking-inquiry/utils/booking-guide-investment.util', () => ({
  computeBookingGuideInvestmentUsd: jest.fn().mockResolvedValue({
    totalUsd: null,
    isPartial: false,
  }),
}));

describe('ContactService', () => {
  let service: ContactService;
  let repository: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['repository'];
  let inbox: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['inbox'];
  let availability: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['availability'];
  let mail: Awaited<ReturnType<typeof createContactServiceTestModule>>['mail'];
  let adminActivityNotify: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['adminActivityNotify'];
  let bookings: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['bookings'];

  beforeEach(async () => {
    const harness = await createContactServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    inbox = harness.inbox;
    availability = harness.availability;
    mail = harness.mail;
    adminActivityNotify = harness.adminActivityNotify;
    bookings = harness.bookings;
  });

  it('create booking inquiry prepares and inserts booking in a transaction', async () => {
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
    expect(mail.sendTransactional).toHaveBeenCalled();
    expect(adminActivityNotify.notifyCustomerActivity).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'BOOKING_INQUIRY' }),
    );
  });

  it('create booking inquiry without prepared booking still materializes contact', async () => {
    const pending = makeContactRequestRow({ id: 'c-plain' });
    const txCreate = jest.fn().mockResolvedValue(pending);
    repository.runTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          contactRequest: { create: txCreate, update: jest.fn() },
        }),
    );
    bookings.preparePublicBookingInquiry.mockResolvedValue(null);

    const result = await service.create(
      makeCreateContactDto({
        eventDate: '2026-09-15',
        inquiryDetails: { entrySource: 'home_service_card' },
      }),
    );

    expect(result.id).toBe('c-plain');
    expect(bookings.insertPublicBookingInquiry).not.toHaveBeenCalled();
  });

  it('create concierge path stores vision snapshot and sends ack', async () => {
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
    expect(mail.sendTransactional).toHaveBeenCalled();
    expect(adminActivityNotify.notifyCustomerActivity).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'CONCIERGE_INQUIRY' }),
    );
  });

  it('create generic inquiry without booking entrySource uses repository.create', async () => {
    const created = makeContactRequestRow();
    repository.create.mockResolvedValue(created);

    const result = await service.create(makeCreateContactDto());

    expect(result).toEqual(created);
    expect(repository.create).toHaveBeenCalled();
    expect(bookings.preparePublicBookingInquiry).not.toHaveBeenCalled();
  });

  it('create dedupe returns existing contact when active booking exists for day', async () => {
    const existing = makeContactRequestRow({ id: 'dup-1' });
    repository.findActiveBookingContactRequestId.mockResolvedValue({
      contactRequestId: 'dup-1',
    });
    repository.findById.mockResolvedValue(existing);

    const result = await service.create(
      makeCreateContactDto({
        eventDate: '2026-09-15',
        email: 'ada@example.com',
        inquiryDetails: { entrySource: 'contact_page' },
      }),
    );

    expect(result.id).toBe('dup-1');
    expect(repository.runTransaction).not.toHaveBeenCalled();
    expect(bookings.preparePublicBookingInquiry).not.toHaveBeenCalled();
  });

  it('create dedupe returns recent contact when linked active booking exists', async () => {
    const recent = makeContactRequestRow({ id: 'recent-1' });
    repository.findActiveBookingContactRequestId.mockResolvedValue(null);
    repository.findRecentContactByEmailAndEventDate.mockResolvedValue(recent);
    repository.findActiveBookingIdByContactRequestId.mockResolvedValue({
      id: 'booking-1',
    });

    const result = await service.create(
      makeCreateContactDto({
        eventDate: '2026-09-15',
        email: 'ada@example.com',
        inquiryDetails: { entrySource: 'inquire_section' },
      }),
    );

    expect(result.id).toBe('recent-1');
    expect(repository.runTransaction).not.toHaveBeenCalled();
  });

  it('create rejects when availability assertDateTimeAllowed fails', async () => {
    availability.assertDateTimeAllowed.mockRejectedValue(
      new BadRequestException('Date/time not available'),
    );

    await expect(
      service.create(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          inquiryDetails: { entrySource: 'contact_page' },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.runTransaction).not.toHaveBeenCalled();
  });

  it('create rejects invalid eventTimeStart in inquiryDetails', async () => {
    await expect(
      service.create(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          inquiryDetails: {
            entrySource: 'contact_page',
            eventTimeStart: '99:99',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findOne throws 404 when missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findOne returns row when present', async () => {
    const row = makeContactRequestRow();
    repository.findById.mockResolvedValue(row);
    await expect(service.findOne('contact-1')).resolves.toEqual(row);
  });

  it('updateStatus sets isRead true for non-PENDING', async () => {
    repository.findById.mockResolvedValue(makeContactRequestRow());
    const updated = makeContactRequestRow({
      status: ContactRequestStatus.RESERVED,
      isRead: true,
    });
    repository.update.mockResolvedValue(updated);

    const result = await service.updateStatus(
      'contact-1',
      ContactRequestStatus.RESERVED,
    );

    expect(result.status).toBe(ContactRequestStatus.RESERVED);
    expect(repository.update).toHaveBeenCalledWith('contact-1', {
      status: ContactRequestStatus.RESERVED,
      isRead: true,
    });
  });

  it('updateStatus sets isRead false when returning to PENDING', async () => {
    repository.findById.mockResolvedValue(
      makeContactRequestRow({ status: ContactRequestStatus.RESERVED }),
    );
    repository.update.mockResolvedValue(
      makeContactRequestRow({ status: ContactRequestStatus.PENDING }),
    );

    await service.updateStatus('contact-1', ContactRequestStatus.PENDING);

    expect(repository.update).toHaveBeenCalledWith('contact-1', {
      status: ContactRequestStatus.PENDING,
      isRead: false,
    });
  });

  it('markAsRead updates status to RESERVED', async () => {
    repository.findById.mockResolvedValue(makeContactRequestRow());
    repository.update.mockResolvedValue(
      makeContactRequestRow({
        isRead: true,
        status: ContactRequestStatus.RESERVED,
      }),
    );

    const result = await service.markAsRead('contact-1');
    expect(result.isRead).toBe(true);
    expect(repository.update).toHaveBeenCalledWith('contact-1', {
      isRead: true,
      status: ContactRequestStatus.RESERVED,
    });
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

  it('findAll returns paginated list', async () => {
    const items = [makeContactRequestRow()];
    repository.count.mockResolvedValue(1);
    repository.findMany.mockResolvedValue(items);

    const result = await service.findAll({ page: 1, perPage: 10 });

    expect(result.items).toEqual(items);
    expect(result.meta.totalItems).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('findAllPeticiones delegates to inbox', async () => {
    const feed = {
      items: [],
      meta: {
        page: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0,
        hasPrev: false,
        hasNext: false,
      },
    };
    inbox.findAllPeticiones.mockResolvedValue(feed);

    await expect(
      service.findAllPeticiones({ page: 1, perPage: 10, lane: 'bookings' }),
    ).resolves.toEqual(feed);
  });

  it('countPeticionesBadge delegates to inbox', async () => {
    inbox.countPeticionesBadge.mockResolvedValue({ count: 4 });
    await expect(
      service.countPeticionesBadge({ lane: 'guidance' }),
    ).resolves.toEqual({ count: 4 });
  });
});
