import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { AvailabilityClosureKind } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import {
  makeAdminSnapshot,
  makeClosurePrismaRow,
  makePublicRules,
  makeWeeklySlotsDto,
} from '../src/modules/availability/__mocks__/availability.fixtures';
import { createAvailabilityServiceMock } from '../src/modules/availability/__mocks__/availability.service.mock';
import { createAvailabilityHttpApp } from '../src/modules/availability/testing/availability-http-app';
import type {
  AdminSnapshotBody,
  ClosureBody,
  ErrorBody,
  PublicRulesBody,
} from '../src/modules/availability/testing/availability.test-types';

const CLOSURE_ID = '11111111-1111-4111-8111-111111111111';

describe('Availability (contract e2e)', () => {
  let app: INestApplication<App>;
  const availabilityService = createAvailabilityServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createAvailabilityHttpApp({
        guardsAllow: false,
        availabilityService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/availability/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('PUT /admin/weekly returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/availability/admin/weekly')
        .send(makeWeeklySlotsDto())
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('POST /admin/closures returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/availability/admin/closures')
        .send({
          kind: AvailabilityClosureKind.SPECIFIC_DATE,
          date: '2026-07-15',
        })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/closures/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/availability/admin/closures/${CLOSURE_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createAvailabilityHttpApp({
        guardsAllow: true,
        availabilityService,
      });
      app = created.app;
    });

    it('GET /public returns typed rules', async () => {
      availabilityService.getPublicRules.mockResolvedValue(makePublicRules());

      const res = await request(app.getHttpServer())
        .get('/api/v1/availability/public')
        .expect(200);

      const body = res.body as PublicRulesBody;
      expect(body.timeZone).toBe('America/New_York');
      expect(body.weekly).toHaveLength(7);
      expect(availabilityService.getPublicRules).toHaveBeenCalled();
    });

    it('GET /admin returns typed snapshot', async () => {
      availabilityService.getAdminSnapshot.mockResolvedValue(
        makeAdminSnapshot(),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/availability/admin')
        .expect(200);

      const body = res.body as AdminSnapshotBody;
      expect(body.timeZone).toBe('America/New_York');
      expect(body.weekly[0]?.id).toBe('w-0');
    });

    it('PUT /admin/weekly returns typed snapshot', async () => {
      availabilityService.putWeeklySlots.mockResolvedValue(makeAdminSnapshot());

      const res = await request(app.getHttpServer())
        .put('/api/v1/availability/admin/weekly')
        .send(makeWeeklySlotsDto())
        .expect(200);

      const body = res.body as AdminSnapshotBody;
      expect(body.weekly).toHaveLength(7);
      expect(availabilityService.putWeeklySlots).toHaveBeenCalled();
    });

    it('POST /admin/closures returns typed closure', async () => {
      const row = makeClosurePrismaRow({ id: CLOSURE_ID });
      availabilityService.createClosure.mockResolvedValue(row);

      const res = await request(app.getHttpServer())
        .post('/api/v1/availability/admin/closures')
        .send({
          kind: AvailabilityClosureKind.SPECIFIC_DATE,
          date: '2026-07-15',
          note: 'Holiday',
        })
        .expect(201);

      const body = res.body as ClosureBody;
      expect(body.id).toBe(CLOSURE_ID);
      expect(body.kind).toBe(AvailabilityClosureKind.SPECIFIC_DATE);
    });

    it('DELETE /admin/closures/:id returns ok', async () => {
      availabilityService.removeClosure.mockResolvedValue({ ok: true });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/availability/admin/closures/${CLOSURE_ID}`)
        .expect(200);

      expect(res.body).toEqual({ ok: true });
      expect(availabilityService.removeClosure).toHaveBeenCalledWith(
        CLOSURE_ID,
      );
    });

    it('DELETE /admin/closures/:id NotFound includes x-request-id', async () => {
      availabilityService.removeClosure.mockRejectedValue(
        new NotFoundException('Closure not found.'),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/availability/admin/closures/${CLOSURE_ID}`)
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toBeTruthy();
    });

    it('PUT /admin/weekly BadRequest includes x-request-id', async () => {
      availabilityService.putWeeklySlots.mockRejectedValue(
        new BadRequestException(
          'slots must include each weekday 0–6 exactly once.',
        ),
      );

      const res = await request(app.getHttpServer())
        .put('/api/v1/availability/admin/weekly')
        .send({ slots: [] })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
      expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toBeTruthy();
    });
  });
});
