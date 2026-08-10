import type { INestApplication } from '@nestjs/common';
import { VenueTableSize } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { makeVenueTableConfigRow } from '../src/modules/venue-tables/__mocks__/venue-tables.fixtures';
import { createVenueTablesServiceMock } from '../src/modules/venue-tables/__mocks__/venue-tables.service.mock';
import { mapVenueTableRow } from '../src/modules/venue-tables/utils/venue-tables-mapper.util';
import { createVenueTablesHttpApp } from '../src/modules/venue-tables/testing/venue-tables-http-app';
import type {
  BulkCreateBody,
  BulkDeleteBody,
  BulkPriceBody,
  ErrorBody,
  VenueTableBody,
  VenueTablesListBody,
} from '../src/modules/venue-tables/testing/venue-tables.test-types';

const TABLE_ID = '11111111-1111-4111-8111-111111111111';

describe('VenueTables (contract e2e)', () => {
  let app: INestApplication<App>;
  const venueTablesService = createVenueTablesServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createVenueTablesHttpApp({
        guardsAllow: false,
        venueTablesService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-tables/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('POST /admin returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/venue-tables/admin')
        .send({
          size: VenueTableSize.LARGE,
          includedChairs: 6,
          bundlePrice: 100,
        })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('DELETE /admin/:id returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/venue-tables/admin/${TABLE_ID}`)
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createVenueTablesHttpApp({
        guardsAllow: true,
        venueTablesService,
      });
      app = created.app;
    });

    it('GET /venue-tables returns typed public catalog', async () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({ id: TABLE_ID }),
      );
      venueTablesService.getPublicVenueTables.mockResolvedValue([mapped]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-tables')
        .expect(200);

      const body = res.body as VenueTablesListBody;
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(TABLE_ID);
      expect(body[0].size).toBe(VenueTableSize.LARGE);
      expect(body[0].visualCoordinates).toBeNull();
    });

    it('GET /venue-tables returns visualCoordinates when mapped with coords', async () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({
          id: TABLE_ID,
          visualX: 15,
          visualY: 25,
        }),
      );
      venueTablesService.getPublicVenueTables.mockResolvedValue([mapped]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-tables')
        .expect(200);

      const body = res.body as VenueTablesListBody;
      expect(body[0].visualCoordinates).toEqual({ x: 15, y: 25 });
      expect(body[0].displayLabel).toBe('Large');
    });

    it('GET /admin returns typed admin list', async () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({ id: TABLE_ID }),
      );
      venueTablesService.getAdminVenueTables.mockResolvedValue([mapped]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-tables/admin')
        .expect(200);

      const body = res.body as VenueTablesListBody;
      expect(body[0].id).toBe(TABLE_ID);
      expect(body[0].tableName).toBe('LARGE-abcd1234');
      expect(body[0].visualCoordinates).toBeNull();
    });

    it('GET /admin/:id returns typed table with null visualCoordinates', async () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({ id: TABLE_ID }),
      );
      venueTablesService.getAdminVenueTableById.mockResolvedValue(mapped);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/venue-tables/admin/${TABLE_ID}`)
        .expect(200);

      const body = res.body as VenueTableBody;
      expect(body.id).toBe(TABLE_ID);
      expect(body.visualCoordinates).toBeNull();
      expect(body.displayLabel).toBe('Large');
    });

    it('POST /admin creates via service mock', async () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({
          id: TABLE_ID,
          tableName: 'VIP',
          bundlePrice: 200,
        }),
      );
      venueTablesService.createAdminVenueTable.mockResolvedValue(mapped);

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-tables/admin')
        .send({
          size: VenueTableSize.LARGE,
          includedChairs: 6,
          bundlePrice: 200,
          tableName: 'VIP',
        })
        .expect(201);

      const body = res.body as VenueTableBody;
      expect(body.tableName).toBe('VIP');
      expect(venueTablesService.createAdminVenueTable).toHaveBeenCalled();
    });

    it('POST /admin/bulk returns typed bulk create body', async () => {
      venueTablesService.bulkCreateAdminVenueTables.mockResolvedValue({
        created: [mapVenueTableRow(makeVenueTableConfigRow({ id: TABLE_ID }))],
        count: 1,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/venue-tables/admin/bulk')
        .send({
          quantity: 1,
          size: VenueTableSize.LARGE,
          includedChairs: 6,
          bundlePrice: 150,
        })
        .expect(201);

      const body = res.body as BulkCreateBody;
      expect(body.count).toBe(1);
      expect(body.created[0].id).toBe(TABLE_ID);
    });

    it('PATCH /admin/bulk-price returns typed bulk price body', async () => {
      venueTablesService.bulkUpdateAdminVenueTablesBundlePrice.mockResolvedValue(
        {
          scope: 'SIZE',
          size: VenueTableSize.MEDIUM,
          updatedCount: 4,
        },
      );

      const res = await request(app.getHttpServer())
        .patch('/api/v1/venue-tables/admin/bulk-price')
        .send({
          scope: 'SIZE',
          size: VenueTableSize.MEDIUM,
          bundlePrice: 175,
        })
        .expect(200);

      const body = res.body as BulkPriceBody;
      expect(body.updatedCount).toBe(4);
      expect(body.size).toBe(VenueTableSize.MEDIUM);
    });

    it('PATCH /admin/:id updates via service mock', async () => {
      venueTablesService.updateAdminVenueTable.mockResolvedValue(
        mapVenueTableRow(
          makeVenueTableConfigRow({ id: TABLE_ID, bundlePrice: 220 }),
        ),
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/venue-tables/admin/${TABLE_ID}`)
        .send({ bundlePrice: 220 })
        .expect(200);

      const body = res.body as VenueTableBody;
      expect(body.bundlePrice).toBe(220);
    });

    it('DELETE /admin/bulk returns typed bulk delete body', async () => {
      venueTablesService.bulkDeleteAdminVenueTables.mockResolvedValue({
        scope: 'ALL',
        size: null,
        deletedCount: 3,
      });

      const res = await request(app.getHttpServer())
        .delete('/api/v1/venue-tables/admin/bulk')
        .send({ scope: 'ALL' })
        .expect(200);

      const body = res.body as BulkDeleteBody;
      expect(body.deletedCount).toBe(3);
      expect(body.scope).toBe('ALL');
    });

    it('DELETE /admin/:id soft-deletes via service mock', async () => {
      venueTablesService.deleteAdminVenueTable.mockResolvedValue(
        mapVenueTableRow(
          makeVenueTableConfigRow({ id: TABLE_ID, isActive: false }),
        ),
      );

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/venue-tables/admin/${TABLE_ID}`)
        .expect(200);

      const body = res.body as VenueTableBody;
      expect(body.isActive).toBe(false);
    });

    it('attaches request id header on public GET', async () => {
      venueTablesService.getPublicVenueTables.mockResolvedValue([]);
      const res = await request(app.getHttpServer())
        .get('/api/v1/venue-tables')
        .expect(200);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });
  });
});
