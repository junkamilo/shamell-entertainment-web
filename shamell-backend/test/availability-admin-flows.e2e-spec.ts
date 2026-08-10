import type { INestApplication } from '@nestjs/common';
import { AvailabilityClosureKind } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeClosurePrismaRow,
  makeWeeklyPrismaRow,
  makeWeeklySlotsDto,
} from '../src/modules/availability/__mocks__/availability.fixtures';
import { createAvailabilityServiceMock } from '../src/modules/availability/__mocks__/availability.service.mock';
import { createAvailabilityHttpApp } from '../src/modules/availability/testing/availability-http-app';
import { createAvailabilityServiceTestModule } from '../src/modules/availability/testing/availability-service.test-module';
import type {
  AdminSnapshotBody,
  ClosureBody,
  ErrorBody,
  PublicRulesBody,
} from '../src/modules/availability/testing/availability.test-types';

const CLOSURE_ID = '11111111-1111-4111-8111-111111111111';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createAvailabilityServiceTestModule>
  >['repository'];
};

async function createDeepAvailabilityHttpApp(): Promise<DeepHarness> {
  const harness = await createAvailabilityServiceTestModule();
  const availabilityService = {
    ...createAvailabilityServiceMock(),
    getPublicRules: () => harness.service.getPublicRules(),
    getAdminSnapshot: () => harness.service.getAdminSnapshot(),
    putWeeklySlots: (dto: unknown) =>
      harness.service.putWeeklySlots(
        dto as Parameters<typeof harness.service.putWeeklySlots>[0],
      ),
    createClosure: (dto: unknown) =>
      harness.service.createClosure(
        dto as Parameters<typeof harness.service.createClosure>[0],
      ),
    removeClosure: (id: string) => harness.service.removeClosure(id),
    bookingTimeZone: () => harness.service.bookingTimeZone(),
    assertDateTimeAllowed: (eventDate: Date) =>
      harness.service.assertDateTimeAllowed(eventDate),
  };

  const { app } = await createAvailabilityHttpApp({
    guardsAllow: true,
    availabilityService,
  });

  return {
    app,
    repository: harness.repository,
  };
}

describe('Availability admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepAvailabilityHttpApp();
    app = created.app;
    repository = created.repository;
  }

  it('GET /public projects rules via real AvailabilityService', async () => {
    await boot();
    repository.findWeeklySlots.mockResolvedValue([makeWeeklyPrismaRow()]);
    repository.findClosures.mockResolvedValue([makeClosurePrismaRow()]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/availability/public')
      .expect(200);

    const body = res.body as PublicRulesBody;
    expect(body.timeZone).toBe('America/New_York');
    expect(body.weekly[0]).not.toHaveProperty('id');
    expect(body.closures[0]?.date).toBe('2026-07-15');
  });

  it('PUT /admin/weekly upserts via real AvailabilityService', async () => {
    await boot();
    repository.upsertAllWeeklySlots.mockResolvedValue(undefined);
    repository.findWeeklySlots.mockResolvedValue(
      Array.from({ length: 7 }, (_, weekday) =>
        makeWeeklyPrismaRow({ id: `w-${weekday}`, weekday }),
      ),
    );
    repository.findClosures.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .put('/api/v1/availability/admin/weekly')
      .send(makeWeeklySlotsDto())
      .expect(200);

    const body = res.body as AdminSnapshotBody;
    expect(body.weekly).toHaveLength(7);
    expect(repository.upsertAllWeeklySlots).toHaveBeenCalled();
  });

  it('PUT /admin/weekly invalid weekday set returns 400', async () => {
    await boot();

    const res = await request(app.getHttpServer())
      .put('/api/v1/availability/admin/weekly')
      .send({
        slots: [
          {
            weekday: 0,
            isClosed: false,
            startTime: '09:00',
            endTime: '21:00',
          },
        ],
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.upsertAllWeeklySlots).not.toHaveBeenCalled();
  });

  it('POST /admin/closures DATE_RANGE via real AvailabilityService', async () => {
    await boot();
    const row = makeClosurePrismaRow({
      id: CLOSURE_ID,
      kind: AvailabilityClosureKind.DATE_RANGE,
      date: null,
      startDate: new Date('2026-07-10T12:00:00.000Z'),
      endDate: new Date('2026-07-20T12:00:00.000Z'),
    });
    repository.createClosure.mockResolvedValue(row);

    const res = await request(app.getHttpServer())
      .post('/api/v1/availability/admin/closures')
      .send({
        kind: AvailabilityClosureKind.DATE_RANGE,
        startDate: '2026-07-10',
        endDate: '2026-07-20',
        note: 'Summer break',
      })
      .expect(201);

    const body = res.body as ClosureBody;
    expect(body.id).toBe(CLOSURE_ID);
    expect(body.kind).toBe(AvailabilityClosureKind.DATE_RANGE);
    expect(repository.createClosure).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: AvailabilityClosureKind.DATE_RANGE,
      }),
    );
  });

  it('POST /admin/closures DATE_RANGE end < start returns 400', async () => {
    await boot();

    const res = await request(app.getHttpServer())
      .post('/api/v1/availability/admin/closures')
      .send({
        kind: AvailabilityClosureKind.DATE_RANGE,
        startDate: '2026-07-20',
        endDate: '2026-07-10',
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.createClosure).not.toHaveBeenCalled();
  });

  it('POST /admin/closures RECURRING_WEEKDAY via real AvailabilityService', async () => {
    await boot();
    const row = makeClosurePrismaRow({
      id: CLOSURE_ID,
      kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
      date: null,
      weekday: 1,
    });
    repository.createClosure.mockResolvedValue(row);

    const res = await request(app.getHttpServer())
      .post('/api/v1/availability/admin/closures')
      .send({
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
        weekday: 1,
      })
      .expect(201);

    const body = res.body as ClosureBody;
    expect(body.weekday).toBe(1);
    expect(repository.createClosure).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: AvailabilityClosureKind.RECURRING_WEEKDAY,
        weekday: 1,
      }),
    );
  });

  it('DELETE /admin/closures/:id NotFound via real AvailabilityService', async () => {
    await boot();
    repository.deleteClosure.mockRejectedValue(new Error('missing'));

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/availability/admin/closures/${CLOSURE_ID}`)
      .expect(404);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(404);
  });

  it('GET /admin returns snapshot with ids via real AvailabilityService', async () => {
    await boot();
    repository.findWeeklySlots.mockResolvedValue([makeWeeklyPrismaRow()]);
    repository.findClosures.mockResolvedValue([
      makeClosurePrismaRow({ id: CLOSURE_ID }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/availability/admin')
      .expect(200);

    const body = res.body as AdminSnapshotBody;
    expect(body.weekly[0]?.id).toBe('w-1');
    expect(body.closures[0]?.id).toBe(CLOSURE_ID);
  });
});
