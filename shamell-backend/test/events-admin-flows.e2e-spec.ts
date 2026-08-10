import type { INestApplication } from '@nestjs/common';
import { EventPublicSection, UpcomingExperienceType } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeCreateEventDto,
  makeEventRow,
  makeEventTypeRow,
  makeHubVenueConfigStub,
  makeOccasionTypeRow,
} from '../src/modules/events/__mocks__/events.fixtures';
import { createEventsServiceMock } from '../src/modules/events/__mocks__/events.service.mock';
import { createEventsHttpApp } from '../src/modules/events/testing/events-http-app';
import { createEventsServiceTestModule } from '../src/modules/events/testing/events-service.test-module';
import type {
  AdminEventBody,
  ErrorBody,
  EventTypeAdminBody,
  HubEventsBody,
  OccasionTypeMutationBody,
  OccasionTypesBody,
  PublicEventsBody,
} from '../src/modules/events/testing/events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_TYPE_ID = '22222222-2222-4222-8222-222222222222';
const OCCASION_ID = '33333333-3333-4333-8333-333333333333';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createEventsServiceTestModule>
  >['repository'];
};

async function createDeepEventsHttpApp(): Promise<DeepHarness> {
  const harness = await createEventsServiceTestModule();
  const eventsService = {
    ...createEventsServiceMock(),
    createEvent: (dto: unknown) =>
      harness.service.createEvent(
        dto as Parameters<typeof harness.service.createEvent>[0],
      ),
    updateEvent: (id: string, dto: unknown) =>
      harness.service.updateEvent(
        id,
        dto as Parameters<typeof harness.service.updateEvent>[1],
      ),
    deleteEvent: (id: string) => harness.service.deleteEvent(id),
    getPublicEvents: (query?: unknown) =>
      harness.service.getPublicEvents(
        query as Parameters<typeof harness.service.getPublicEvents>[0],
      ),
    getContactLines: () => harness.service.getContactLines(),
    getAdminOccasionTypes: () => harness.service.getAdminOccasionTypes(),
    createOccasionType: (dto: unknown) =>
      harness.service.createOccasionType(
        dto as Parameters<typeof harness.service.createOccasionType>[0],
      ),
    updateOccasionType: (id: string, dto: unknown) =>
      harness.service.updateOccasionType(
        id,
        dto as Parameters<typeof harness.service.updateOccasionType>[1],
      ),
    deleteOccasionType: (id: string) => harness.service.deleteOccasionType(id),
    createEventType: (dto: unknown) =>
      harness.service.createEventType(
        dto as Parameters<typeof harness.service.createEventType>[0],
      ),
    getAdminEventTypes: (query?: unknown) =>
      harness.service.getAdminEventTypes(
        query as Parameters<typeof harness.service.getAdminEventTypes>[0],
      ),
  };

  const { app } = await createEventsHttpApp({
    guardsAllow: true,
    eventsService,
    galleryService: harness.gallery,
  });

  return {
    app,
    repository: harness.repository,
  };
}

describe('Events admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepEventsHttpApp();
    app = created.app;
    repository = created.repository;
  }

  it('POST /admin creates event via real EventsService (201)', async () => {
    await boot();
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({ id: EVENT_TYPE_ID, isActive: true }),
    );
    repository.findEventTypeName.mockResolvedValue({ name: 'Wedding' });
    repository.createEvent.mockResolvedValue(
      makeEventRow({
        id: EVENT_ID,
        eventTypeId: EVENT_TYPE_ID,
        eventType: makeEventTypeRow({ id: EVENT_TYPE_ID }),
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/events/admin')
      .send(
        makeCreateEventDto({
          eventTypeId: EVENT_TYPE_ID,
        }),
      )
      .expect(201);

    const body = res.body as AdminEventBody;
    expect(body.message).toContain('created');
    expect(body.event?.id).toBe(EVENT_ID);
    expect(repository.createEvent).toHaveBeenCalled();
  });

  it('PATCH /admin/:id updates via real EventsService', async () => {
    await boot();
    repository.findEventForUpdate.mockResolvedValue({
      id: EVENT_ID,
      eventTypeId: EVENT_TYPE_ID,
      publicSection: EventPublicSection.GENERAL,
    });
    repository.updateEvent.mockResolvedValue(
      makeEventRow({
        id: EVENT_ID,
        description: 'Updated via deep e2e.',
        eventType: makeEventTypeRow({ id: EVENT_TYPE_ID }),
      }),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/events/admin/${EVENT_ID}`)
      .send({ description: 'Updated via deep e2e.' })
      .expect(200);

    const body = res.body as AdminEventBody;
    expect(body.event?.description).toBe('Updated via deep e2e.');
  });

  it('DELETE /admin/:id booking guard returns conflict', async () => {
    await boot();
    repository.findEventForDelete.mockResolvedValue({
      id: EVENT_ID,
      eventTypeId: EVENT_TYPE_ID,
      publicSection: EventPublicSection.GENERAL,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 2,
      seatReservationCount: 0,
      classEnrollmentCount: 0,
    });

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/events/admin/${EVENT_ID}`)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(409);
    expect(repository.deleteEvent).not.toHaveBeenCalled();
  });

  it('GET /events public list returns 200 via real EventsService', async () => {
    await boot();
    repository.findPublicEventsForSection.mockResolvedValue([
      makeEventRow({
        id: EVENT_ID,
        eventType: makeEventTypeRow({ id: EVENT_TYPE_ID }),
      }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/events')
      .expect(200);

    const body = res.body as PublicEventsBody;
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(EVENT_ID);
    expect(body[0]?.eventTypeName).toBe('Wedding');
  });

  it('GET /events?publicSection=UPCOMING_EVENTS hub enrich via real service', async () => {
    await boot();
    repository.findPublicUpcomingHubEvents.mockResolvedValue([
      makeEventRow({
        id: EVENT_ID,
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.CLASSES,
        slug: 'salsa',
        price: 50,
        eventType: makeEventTypeRow({ id: EVENT_TYPE_ID, name: 'Salsa' }),
      }),
    ]);
    repository.groupActiveClassSessionsByEvent.mockResolvedValue([
      { eventId: EVENT_ID, _count: { _all: 2 } },
    ]);
    repository.findHubVenueConfigs.mockResolvedValue([
      makeHubVenueConfigStub({
        eventId: EVENT_ID,
        clientEnabled: true,
      }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/events')
      .query({ publicSection: EventPublicSection.UPCOMING_EVENTS })
      .expect(200);

    const body = res.body as HubEventsBody;
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(EVENT_ID);
    expect(body[0]?.hasActiveSessions).toBe(true);
    expect(typeof body[0]?.salesOpen).toBe('boolean');
    expect(body[0]?.purchaseMode).toBeDefined();
  });

  it('POST /occasions/admin creates via real EventsService (201)', async () => {
    await boot();
    repository.createOccasionType.mockResolvedValue(
      makeOccasionTypeRow({
        id: OCCASION_ID,
        name: 'Anniversary',
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/events/occasions/admin')
      .send({ name: 'Anniversary' })
      .expect(201);

    const body = res.body as OccasionTypeMutationBody;
    expect(body.message).toContain('created');
    expect(body.occasionType.id).toBe(OCCASION_ID);
    expect(body.occasionType.name).toBe('Anniversary');
  });

  it('GET /occasions/admin lists via real EventsService', async () => {
    await boot();
    repository.findAdminOccasionTypes.mockResolvedValue([
      makeOccasionTypeRow({
        id: OCCASION_ID,
        name: 'Birthday',
        _count: { bookings: 1, eventLinks: 2 },
      }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/events/occasions/admin')
      .expect(200);

    const body = res.body as OccasionTypesBody;
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(OCCASION_ID);
    expect(body[0]?.bookingCount).toBe(1);
    expect(body[0]?.eventTypeLinkCount).toBe(2);
  });

  it('DELETE /occasions/admin/:id booking guard returns 409', async () => {
    await boot();
    repository.findOccasionTypeId.mockResolvedValue({ id: OCCASION_ID });
    repository.countBookingsForOccasion.mockResolvedValue(2);

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/events/occasions/admin/${OCCASION_ID}`)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(409);
    expect(repository.deleteOccasionType).not.toHaveBeenCalled();
  });

  it('POST /types/admin creates event type via real EventsService (201)', async () => {
    await boot();
    const created = makeEventTypeRow({
      id: EVENT_TYPE_ID,
      name: 'Corporate',
    });
    repository.createBookingEventType.mockResolvedValue(created);
    repository.findEventTypeAdminById.mockResolvedValue({
      ...created,
      occasionLinks: [],
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/events/types/admin')
      .send({ name: 'Corporate' })
      .expect(201);

    const body = res.body as EventTypeAdminBody;
    expect(body.message).toContain('created');
    expect(body.eventType.id).toBe(EVENT_TYPE_ID);
    expect(body.eventType.name).toBe('Corporate');
  });
});
