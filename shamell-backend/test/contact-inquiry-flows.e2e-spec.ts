import { BadRequestException, type INestApplication } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeContactRequestRow,
  makeCreateContactDto,
} from '../src/modules/contact/__mocks__/contact.fixtures';
import { createContactServiceMock } from '../src/modules/contact/__mocks__/contact.service.mock';
import { createContactHttpApp } from '../src/modules/contact/testing/contact-http-app';
import { createContactServiceTestModule } from '../src/modules/contact/testing/contact-service.test-module';
import type {
  ContactCreatedBody,
  ContactListBody,
  ErrorBody,
  PeticionesBadgeBody,
} from '../src/modules/contact/testing/contact.test-types';

jest.mock(
  '../src/modules/booking-inquiry/utils/booking-guide-investment.util',
  () => ({
    computeBookingGuideInvestmentUsd: jest.fn().mockResolvedValue({
      totalUsd: null,
      isPartial: false,
    }),
  }),
);

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['repository'];
  inbox: Awaited<ReturnType<typeof createContactServiceTestModule>>['inbox'];
  availability: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['availability'];
  mail: Awaited<ReturnType<typeof createContactServiceTestModule>>['mail'];
  bookings: Awaited<
    ReturnType<typeof createContactServiceTestModule>
  >['bookings'];
};

async function createDeepContactHttpApp(): Promise<DeepHarness> {
  const harness = await createContactServiceTestModule();
  const contactService = {
    ...createContactServiceMock(),
    create: (dto: unknown) =>
      harness.service.create(
        dto as Parameters<typeof harness.service.create>[0],
      ),
    findAll: (query: unknown) =>
      harness.service.findAll(
        query as Parameters<typeof harness.service.findAll>[0],
      ),
    findAllPeticiones: (query: unknown) =>
      harness.service.findAllPeticiones(
        query as Parameters<typeof harness.service.findAllPeticiones>[0],
      ),
    countPeticionesBadge: (query: unknown) =>
      harness.service.countPeticionesBadge(
        query as Parameters<typeof harness.service.countPeticionesBadge>[0],
      ),
    findOne: (id: string) => harness.service.findOne(id),
    markAsRead: (id: string) => harness.service.markAsRead(id),
    updateStatus: (id: string, status: ContactRequestStatus) =>
      harness.service.updateStatus(id, status),
    remove: (id: string) => harness.service.remove(id),
  };

  const { app } = await createContactHttpApp({
    guardsAllow: true,
    contactService,
  });

  return {
    app,
    repository: harness.repository,
    inbox: harness.inbox,
    availability: harness.availability,
    mail: harness.mail,
    bookings: harness.bookings,
  };
}

describe('Contact inquiry flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let inbox: DeepHarness['inbox'];
  let availability: DeepHarness['availability'];
  let mail: DeepHarness['mail'];
  let bookings: DeepHarness['bookings'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepContactHttpApp();
    app = created.app;
    repository = created.repository;
    inbox = created.inbox;
    availability = created.availability;
    mail = created.mail;
    bookings = created.bookings;
  }

  it('POST /contact creates concierge inquiry via real ContactService', async () => {
    await boot();
    repository.create.mockResolvedValue(
      makeContactRequestRow({
        id: 'concierge-1',
        subject: 'Concierge inquiry',
        inquiryDetails: { entrySource: 'concierge_gate' },
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/contact')
      .send(
        makeCreateContactDto({
          subject: 'Concierge inquiry',
          inquiryDetails: { entrySource: 'concierge_gate' },
        }),
      )
      .expect(201);

    const body = res.body as ContactCreatedBody;
    expect(body.id).toBe('concierge-1');
    expect(repository.create).toHaveBeenCalled();
    expect(mail.sendTransactional).toHaveBeenCalled();
    expect(bookings.preparePublicBookingInquiry).not.toHaveBeenCalled();
  });

  it('POST /contact booking inquiry materializes RESERVED via real service', async () => {
    await boot();
    const reserved = makeContactRequestRow({
      id: 'book-1',
      status: ContactRequestStatus.RESERVED,
      isRead: true,
    });
    const txCreate = jest
      .fn()
      .mockResolvedValue(makeContactRequestRow({ id: 'book-1' }));
    const txUpdate = jest.fn().mockResolvedValue(reserved);
    repository.runTransaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) =>
        fn({
          contactRequest: { create: txCreate, update: txUpdate },
        }),
    );
    bookings.preparePublicBookingInquiry.mockResolvedValue({ prepared: true });
    bookings.insertPublicBookingInquiry.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .post('/api/v1/contact')
      .send(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          inquiryDetails: { entrySource: 'contact_page' },
        }),
      )
      .expect(201);

    const body = res.body as ContactCreatedBody;
    expect(body.id).toBe('book-1');
    expect(body.status).toBe(ContactRequestStatus.RESERVED);
    expect(bookings.insertPublicBookingInquiry).toHaveBeenCalled();
  });

  it('POST /contact returns existing row on booking inquiry dedupe', async () => {
    await boot();
    repository.findActiveBookingContactRequestId.mockResolvedValue({
      contactRequestId: 'dup-1',
    });
    repository.findById.mockResolvedValue(
      makeContactRequestRow({ id: 'dup-1' }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/contact')
      .send(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          inquiryDetails: { entrySource: 'contact_page' },
        }),
      )
      .expect(201);

    const body = res.body as ContactCreatedBody;
    expect(body.id).toBe('dup-1');
    expect(repository.runTransaction).not.toHaveBeenCalled();
  });

  it('POST /contact returns 400 when availability rejects', async () => {
    await boot();
    availability.assertDateTimeAllowed.mockRejectedValue(
      new BadRequestException('Date/time not available'),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/contact')
      .send(
        makeCreateContactDto({
          eventDate: '2026-09-15',
          inquiryDetails: { entrySource: 'contact_page' },
        }),
      )
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
  });

  it('GET /contact lists via real ContactService', async () => {
    await boot();
    repository.count.mockResolvedValue(1);
    repository.findMany.mockResolvedValue([
      makeContactRequestRow({ id: 'list-1' }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/contact')
      .expect(200);

    const body = res.body as ContactListBody;
    expect(body.items[0]?.id).toBe('list-1');
    expect(body.meta.totalItems).toBe(1);
  });

  it('PATCH /contact/:id/status updates via real ContactService', async () => {
    await boot();
    repository.findById.mockResolvedValue(makeContactRequestRow({ id: 's-1' }));
    repository.update.mockResolvedValue(
      makeContactRequestRow({
        id: 's-1',
        status: ContactRequestStatus.CANCELLED,
        isRead: true,
      }),
    );

    const res = await request(app.getHttpServer())
      .patch('/api/v1/contact/s-1/status')
      .send({ status: ContactRequestStatus.CANCELLED })
      .expect(200);

    const body = res.body as ContactCreatedBody;
    expect(body.status).toBe(ContactRequestStatus.CANCELLED);
  });

  it('DELETE /contact/:id removes CANCELLED via real ContactService', async () => {
    await boot();
    repository.findById.mockResolvedValue(
      makeContactRequestRow({
        id: 'del-1',
        status: ContactRequestStatus.CANCELLED,
      }),
    );
    repository.delete.mockResolvedValue(
      makeContactRequestRow({
        id: 'del-1',
        status: ContactRequestStatus.CANCELLED,
      }),
    );

    const res = await request(app.getHttpServer())
      .delete('/api/v1/contact/del-1')
      .expect(200);

    const body = res.body as ContactCreatedBody;
    expect(body.id).toBe('del-1');
    expect(repository.delete).toHaveBeenCalledWith('del-1');
  });

  it('DELETE /contact/:id rejects non-CANCELLED via real ContactService', async () => {
    await boot();
    repository.findById.mockResolvedValue(
      makeContactRequestRow({
        id: 'del-pending',
        status: ContactRequestStatus.PENDING,
      }),
    );

    const res = await request(app.getHttpServer())
      .delete('/api/v1/contact/del-pending')
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('GET /contact/peticiones/badge counts via real ContactService', async () => {
    await boot();
    inbox.countPeticionesBadge.mockResolvedValue({ count: 3 });

    const res = await request(app.getHttpServer())
      .get('/api/v1/contact/peticiones/badge')
      .query({ lane: 'guidance' })
      .expect(200);

    const body = res.body as PeticionesBadgeBody;
    expect(body.count).toBe(3);
  });
});
