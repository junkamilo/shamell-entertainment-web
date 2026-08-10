import type { INestApplication } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { createStandaloneChairsServiceMock } from '../src/modules/standalone-chairs/__mocks__/standalone-chairs.service.mock';
import { createStandaloneChairsHttpApp } from '../src/modules/standalone-chairs/testing/standalone-chairs-http-app';
import type {
  AdminStandaloneChairsBody,
  ErrorBody,
  PublicStandaloneChairsBody,
} from '../src/modules/standalone-chairs/testing/standalone-chairs.test-types';

const CHAIR_ID = '11111111-1111-4111-8111-111111111111';

describe('StandaloneChairs (contract e2e)', () => {
  let app: INestApplication<App>;
  const standaloneChairsService = createStandaloneChairsServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createStandaloneChairsHttpApp({
        guardsAllow: false,
        standaloneChairsService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/standalone-chairs/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('PUT /admin returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/standalone-chairs/admin')
        .send({ availableQuantity: 2, unitPrice: 25 })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/bulk-price returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/standalone-chairs/admin/bulk-price')
        .send({ unitPrice: 30 })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/all returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/standalone-chairs/admin/all')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PATCH /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
        .send({ unitPrice: 40 })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createStandaloneChairsHttpApp({
        guardsAllow: true,
        standaloneChairsService,
      });
      app = created.app;
    });

    it('GET /standalone-chairs returns typed public catalog', async () => {
      standaloneChairsService.getPublicStandaloneChairs.mockResolvedValue({
        id: 'config-1',
        availableQuantity: 1,
        unitPrice: 25,
        updatedAt: null,
        isDefault: false,
        chairs: [
          {
            id: CHAIR_ID,
            unitPrice: 25,
            chairName: 'CHAIR-abcd1234',
            sortOrder: 0,
            isActive: true,
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/standalone-chairs')
        .expect(200);

      const body = res.body as PublicStandaloneChairsBody;
      expect(body.availableQuantity).toBe(1);
      expect(body.chairs[0]?.id).toBe(CHAIR_ID);
      expect(
        standaloneChairsService.getPublicStandaloneChairs,
      ).toHaveBeenCalled();
    });

    it('GET /admin returns typed admin inventory', async () => {
      standaloneChairsService.getAdminStandaloneChairs.mockResolvedValue({
        id: 'config-1',
        availableQuantity: 1,
        unitPrice: 25,
        updatedAt: null,
        isDefault: false,
        reservedCount: 0,
        totalCount: 1,
        chairs: [
          {
            id: CHAIR_ID,
            chairName: 'CHAIR-abcd1234',
            unitPrice: 25,
            sortOrder: 0,
            isActive: true,
            isReserved: false,
            isOnFloorPlan: false,
            canDelete: true,
            canEditPrice: true,
          },
        ],
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/standalone-chairs/admin')
        .expect(200);

      const body = res.body as AdminStandaloneChairsBody;
      expect(body.totalCount).toBe(1);
      expect(body.chairs[0]?.canEditPrice).toBe(true);
    });

    it('PUT /admin upserts quantity', async () => {
      standaloneChairsService.upsertAdminStandaloneChairs.mockResolvedValue({
        id: 'config-1',
        availableQuantity: 2,
        unitPrice: 25,
        updatedAt: null,
        isDefault: false,
        reservedCount: 0,
        totalCount: 2,
        chairs: [],
      });

      const res = await request(app.getHttpServer())
        .put('/api/v1/standalone-chairs/admin')
        .send({ availableQuantity: 2, unitPrice: 25 })
        .expect(200);

      const body = res.body as AdminStandaloneChairsBody;
      expect(body.availableQuantity).toBe(2);
      expect(
        standaloneChairsService.upsertAdminStandaloneChairs,
      ).toHaveBeenCalledWith({ availableQuantity: 2, unitPrice: 25 });
    });

    it('PATCH /admin/bulk-price returns typed body', async () => {
      standaloneChairsService.patchAdminStandaloneChairsBulkPrice.mockResolvedValue(
        {
          id: 'config-1',
          availableQuantity: 1,
          unitPrice: 40,
          updatedAt: null,
          isDefault: false,
          reservedCount: 0,
          totalCount: 1,
          chairs: [],
        },
      );

      const res = await request(app.getHttpServer())
        .patch('/api/v1/standalone-chairs/admin/bulk-price')
        .send({ unitPrice: 40 })
        .expect(200);

      const body = res.body as AdminStandaloneChairsBody;
      expect(body.unitPrice).toBe(40);
    });

    it('PATCH /admin/:id returns 404 when service throws NotFound', async () => {
      standaloneChairsService.patchAdminStandaloneChair.mockRejectedValue(
        new NotFoundException('Standalone chair not found.'),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
        .send({ unitPrice: 40 })
        .expect(404);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(404);
      expect(res.headers[REQUEST_ID_HEADER.toLowerCase()]).toBeTruthy();
    });

    it('DELETE /admin/:id returns 400 when reserved', async () => {
      standaloneChairsService.deleteAdminStandaloneChair.mockRejectedValue(
        new BadRequestException(
          'Cannot delete: this chair has an active reservation.',
        ),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(400);
    });

    it('DELETE /admin/all returns typed empty inventory', async () => {
      standaloneChairsService.deleteAllAdminStandaloneChairs.mockResolvedValue({
        id: 'config-1',
        availableQuantity: 0,
        unitPrice: 25,
        updatedAt: null,
        isDefault: false,
        reservedCount: 0,
        totalCount: 0,
        chairs: [],
      });

      const res = await request(app.getHttpServer())
        .delete('/api/v1/standalone-chairs/admin/all')
        .expect(200);

      const body = res.body as AdminStandaloneChairsBody;
      expect(body.totalCount).toBe(0);
    });
  });
});
