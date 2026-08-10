import { BadRequestException, ConflictException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { makeEventRow } from '../src/modules/events/__mocks__/events.fixtures';
import { createEventsServiceMock } from '../src/modules/events/__mocks__/events.service.mock';
import { createEventsHttpApp } from '../src/modules/events/testing/events-http-app';
import type {
  AdminEventBody,
  ContactLinesBody,
  DeleteEventBody,
  ErrorBody,
  PublicEventsBody,
} from '../src/modules/events/testing/events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';

describe('Events (contract e2e)', () => {
  let app: INestApplication<App>;
  const eventsService = createEventsServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createEventsHttpApp({
        guardsAllow: false,
        eventsService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/events/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST /admin returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/events/admin')
        .send({
          eventTypeId: EVENT_ID,
          description: 'x',
          items: ['a'],
        })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/events/admin/${EVENT_ID}`)
        .send({ description: 'y' })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/events/admin/${EVENT_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createEventsHttpApp({
        guardsAllow: true,
        eventsService,
      });
      app = created.app;
    });

    it('GET /events returns typed public catalog', async () => {
      eventsService.getPublicEvents.mockResolvedValue([
        { id: EVENT_ID, eventTypeName: 'Wedding' },
      ]);
      const res = await request(app.getHttpServer())
        .get('/api/v1/events')
        .expect(200);
      const body = res.body as PublicEventsBody;
      expect(body[0]?.id).toBe(EVENT_ID);
      expect(body[0]?.eventTypeName).toBe('Wedding');
    });

    it('GET /contact-lines returns typed lines', async () => {
      eventsService.getContactLines.mockResolvedValue([
        {
          id: EVENT_ID,
          eventTypeId: 'et-1',
          eventTypeName: 'Wedding',
          lineKind: 'event',
        },
      ]);
      const res = await request(app.getHttpServer())
        .get('/api/v1/events/contact-lines')
        .expect(200);
      const body = res.body as ContactLinesBody;
      expect(body[0]?.lineKind).toBe('event');
    });

    it('POST /admin returns typed create stub', async () => {
      const mapped = makeEventRow({ id: EVENT_ID });
      eventsService.createEvent.mockResolvedValue({
        message: 'Event created successfully.',
        event: {
          id: mapped.id,
          eventTypeId: mapped.eventTypeId,
          eventTypeName: 'Wedding',
          description: mapped.description,
          isActive: true,
        },
      });
      const res = await request(app.getHttpServer())
        .post('/api/v1/events/admin')
        .send({
          eventTypeId: EVENT_ID,
          description: 'A signature celebration.',
          items: ['DJ'],
        })
        .expect(201);
      const body = res.body as AdminEventBody;
      expect(body.message).toContain('created');
      expect(body.event?.id).toBe(EVENT_ID);
    });

    it('PATCH /admin/:id returns typed update stub', async () => {
      eventsService.updateEvent.mockResolvedValue({
        message: 'Event updated successfully.',
        event: {
          id: EVENT_ID,
          eventTypeId: 'et-1',
          eventTypeName: 'Wedding',
          description: 'Updated.',
          isActive: true,
        },
      });
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/events/admin/${EVENT_ID}`)
        .send({ description: 'Updated.' })
        .expect(200);
      const body = res.body as AdminEventBody;
      expect(body.event?.description).toBe('Updated.');
    });

    it('DELETE /admin/:id returns typed delete stub', async () => {
      eventsService.deleteEvent.mockResolvedValue({
        message: 'Event deleted successfully.',
      });
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/events/admin/${EVENT_ID}`)
        .expect(200);
      const body = res.body as DeleteEventBody;
      expect(body.message).toContain('deleted');
    });

    it('DELETE /admin/:id Conflict includes x-request-id', async () => {
      eventsService.deleteEvent.mockRejectedValue(
        new ConflictException(
          'Cannot delete this event because it has associated bookings.',
        ),
      );
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/events/admin/${EVENT_ID}`)
        .expect(409);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(409);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });

    it('PATCH /admin/:id BadRequest includes x-request-id', async () => {
      eventsService.updateEvent.mockRejectedValue(
        new BadRequestException(
          'publicSection cannot be changed after create; create the event in the correct admin surface.',
        ),
      );
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/events/admin/${EVENT_ID}`)
        .send({ publicSection: 'UPCOMING_EVENTS' })
        .expect(400);
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });
  });
});
