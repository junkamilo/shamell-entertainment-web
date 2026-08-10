import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import {
  makeContactRequestRow,
  makeCreateContactDto,
} from '../src/modules/contact/__mocks__/contact.fixtures';
import { createContactServiceMock } from '../src/modules/contact/__mocks__/contact.service.mock';
import { createContactHttpApp } from '../src/modules/contact/testing/contact-http-app';
import type {
  ContactCreatedBody,
  ContactListBody,
  ErrorBody,
  PeticionesBadgeBody,
  PeticionesBody,
} from '../src/modules/contact/testing/contact.test-types';

const CONTACT_ID = '11111111-1111-4111-8111-111111111111';

describe('Contact (contract e2e)', () => {
  let app: INestApplication<App>;
  const contactService = createContactServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createContactHttpApp({
        guardsAllow: false,
        contactService,
      });
      app = created.app;
    });

    it('GET /contact returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/contact')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('GET /contact/peticiones returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/contact/peticiones')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('GET /contact/peticiones/badge returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/contact/peticiones/badge')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('GET /contact/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/contact/${CONTACT_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /contact/:id/status returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/contact/${CONTACT_ID}/status`)
        .send({ status: ContactRequestStatus.RESERVED })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /contact/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/contact/${CONTACT_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createContactHttpApp({
        guardsAllow: true,
        contactService,
      });
      app = created.app;
    });

    it('POST /contact returns typed created body', async () => {
      contactService.create.mockResolvedValue(
        makeContactRequestRow({
          id: CONTACT_ID,
          subject: 'Reservation inquiry',
        }),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/contact')
        .send(makeCreateContactDto())
        .expect(201);

      const body = res.body as ContactCreatedBody;
      expect(body.id).toBe(CONTACT_ID);
      expect(body.email).toBe('ada@example.com');
      expect(contactService.create).toHaveBeenCalled();
    });

    it('GET /contact returns typed list', async () => {
      contactService.findAll.mockResolvedValue({
        items: [makeContactRequestRow({ id: CONTACT_ID })],
        meta: {
          page: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/contact')
        .expect(200);

      const body = res.body as ContactListBody;
      expect(body.items[0]?.id).toBe(CONTACT_ID);
      expect(body.meta.totalItems).toBe(1);
    });

    it('GET /contact/peticiones returns typed feed', async () => {
      contactService.findAllPeticiones.mockResolvedValue({
        items: [{ origin: 'CONTACT', id: CONTACT_ID, created_at: new Date() }],
        meta: {
          page: 1,
          perPage: 10,
          totalItems: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/contact/peticiones')
        .query({ lane: 'bookings' })
        .expect(200);

      const body = res.body as PeticionesBody;
      expect(body.items[0]?.id).toBe(CONTACT_ID);
      expect(body.meta.totalItems).toBe(1);
    });

    it('GET /contact/peticiones/badge returns count', async () => {
      contactService.countPeticionesBadge.mockResolvedValue({ count: 7 });

      const res = await request(app.getHttpServer())
        .get('/api/v1/contact/peticiones/badge')
        .query({ lane: 'bookings' })
        .expect(200);

      const body = res.body as PeticionesBadgeBody;
      expect(body.count).toBe(7);
    });

    it('GET /contact/:id returns typed row', async () => {
      contactService.findOne.mockResolvedValue(
        makeContactRequestRow({ id: CONTACT_ID }),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/contact/${CONTACT_ID}`)
        .expect(200);

      const body = res.body as ContactCreatedBody;
      expect(body.id).toBe(CONTACT_ID);
    });

    it('PATCH /contact/:id/read returns updated row', async () => {
      contactService.markAsRead.mockResolvedValue(
        makeContactRequestRow({
          id: CONTACT_ID,
          isRead: true,
          status: ContactRequestStatus.RESERVED,
        }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contact/${CONTACT_ID}/read`)
        .expect(200);

      const body = res.body as ContactCreatedBody;
      expect(body.isRead).toBe(true);
      expect(body.status).toBe(ContactRequestStatus.RESERVED);
    });

    it('PATCH /contact/:id/status returns updated status', async () => {
      contactService.updateStatus.mockResolvedValue(
        makeContactRequestRow({
          id: CONTACT_ID,
          status: ContactRequestStatus.CANCELLED,
          isRead: true,
        }),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/contact/${CONTACT_ID}/status`)
        .send({ status: ContactRequestStatus.CANCELLED })
        .expect(200);

      const body = res.body as ContactCreatedBody;
      expect(body.status).toBe(ContactRequestStatus.CANCELLED);
    });

    it('DELETE /contact/:id returns deleted row', async () => {
      contactService.remove.mockResolvedValue(
        makeContactRequestRow({
          id: CONTACT_ID,
          status: ContactRequestStatus.CANCELLED,
        }),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/contact/${CONTACT_ID}`)
        .expect(200);

      const body = res.body as ContactCreatedBody;
      expect(body.id).toBe(CONTACT_ID);
      expect(body.status).toBe(ContactRequestStatus.CANCELLED);
    });

    it('GET /contact/:id NotFound includes x-request-id', async () => {
      contactService.findOne.mockRejectedValue(
        new NotFoundException('Contact request not found'),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/contact/${CONTACT_ID}`)
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('DELETE /contact/:id BadRequest includes typed error body', async () => {
      contactService.remove.mockRejectedValue(
        new BadRequestException(
          'Only cancelled contact requests can be deleted.',
        ),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/contact/${CONTACT_ID}`)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
    });
  });
});
