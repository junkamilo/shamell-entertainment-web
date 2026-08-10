import type { INestApplication } from '@nestjs/common';
import { VenueTableSize } from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { makeVenueTableConfigRow } from '../src/modules/venue-tables/__mocks__/venue-tables.fixtures';
import { createVenueTablesServiceMock } from '../src/modules/venue-tables/__mocks__/venue-tables.service.mock';
import { VenueTableBulkDeleteScope } from '../src/modules/venue-tables/dto/bulk-delete-venue-table-config.dto';
import { createVenueTablesHttpApp } from '../src/modules/venue-tables/testing/venue-tables-http-app';
import { createVenueTablesServiceTestModule } from '../src/modules/venue-tables/testing/venue-tables-service.test-module';
import type {
  BulkCreateBody,
  BulkDeleteBody,
  BulkPriceBody,
  ErrorBody,
  VenueTableBody,
} from '../src/modules/venue-tables/testing/venue-tables.test-types';
import * as venueTableNames from '../src/modules/venue-tables/utils/venue-table-names.util';

const TABLE_ID = '11111111-1111-4111-8111-111111111111';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createVenueTablesServiceTestModule>
  >['repository'];
  floorLayout: Awaited<
    ReturnType<typeof createVenueTablesServiceTestModule>
  >['floorLayout'];
};

async function createDeepVenueTablesHttpApp(): Promise<DeepHarness> {
  const harness = await createVenueTablesServiceTestModule();
  const venueTablesService = {
    ...createVenueTablesServiceMock(),
    getPublicVenueTables: () => harness.service.getPublicVenueTables(),
    getAdminVenueTables: () => harness.service.getAdminVenueTables(),
    getAdminVenueTableById: (id: string) =>
      harness.service.getAdminVenueTableById(id),
    createAdminVenueTable: (dto: unknown) =>
      harness.service.createAdminVenueTable(
        dto as Parameters<typeof harness.service.createAdminVenueTable>[0],
      ),
    bulkCreateAdminVenueTables: (dto: unknown) =>
      harness.service.bulkCreateAdminVenueTables(
        dto as Parameters<typeof harness.service.bulkCreateAdminVenueTables>[0],
      ),
    updateAdminVenueTable: (id: string, dto: unknown) =>
      harness.service.updateAdminVenueTable(
        id,
        dto as Parameters<typeof harness.service.updateAdminVenueTable>[1],
      ),
    deleteAdminVenueTable: (id: string) =>
      harness.service.deleteAdminVenueTable(id),
    bulkUpdateAdminVenueTablesBundlePrice: (dto: unknown) =>
      harness.service.bulkUpdateAdminVenueTablesBundlePrice(
        dto as Parameters<
          typeof harness.service.bulkUpdateAdminVenueTablesBundlePrice
        >[0],
      ),
    bulkDeleteAdminVenueTables: (dto: unknown) =>
      harness.service.bulkDeleteAdminVenueTables(
        dto as Parameters<typeof harness.service.bulkDeleteAdminVenueTables>[0],
      ),
  };

  const { app } = await createVenueTablesHttpApp({
    guardsAllow: true,
    venueTablesService,
  });

  return {
    app,
    repository: harness.repository,
    floorLayout: harness.floorLayout,
  };
}

describe('VenueTables admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let floorLayout: DeepHarness['floorLayout'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepVenueTablesHttpApp();
    app = created.app;
    repository = created.repository;
    floorLayout = created.floorLayout;
  }

  it('POST /admin creates via real VenueTablesService (201)', async () => {
    await boot();
    repository.create.mockImplementation(
      (data: { id: string; tableName: string; size: VenueTableSize }) =>
        Promise.resolve(
          makeVenueTableConfigRow({
            id: data.id,
            tableName: data.tableName,
            size: data.size,
            includedChairs: 6,
            bundlePrice: 200,
          }),
        ),
    );

    const res = await request(app.getHttpServer())
      .post('/api/v1/venue-tables/admin')
      .send({
        size: VenueTableSize.LARGE,
        includedChairs: 6,
        bundlePrice: 200,
        tableName: 'Deep VIP',
      })
      .expect(201);

    const body = res.body as VenueTableBody;
    expect(body.tableName).toBe('Deep VIP');
    expect(body.bundlePrice).toBe(200);
    expect(body.visualCoordinates).toBeNull();
    expect(repository.create).toHaveBeenCalled();
  });

  it('GET /admin/:id returns visualCoordinates from mapped row', async () => {
    await boot();
    repository.findById.mockResolvedValue(
      makeVenueTableConfigRow({
        id: TABLE_ID,
        visualX: 40,
        visualY: 60,
        tableName: 'LARGE-coords',
      }),
    );

    const res = await request(app.getHttpServer())
      .get(`/api/v1/venue-tables/admin/${TABLE_ID}`)
      .expect(200);

    const body = res.body as VenueTableBody;
    expect(body.id).toBe(TABLE_ID);
    expect(body.visualCoordinates).toEqual({ x: 40, y: 60 });
    expect(body.displayLabel).toBe('Large');
  });

  it('POST /admin/bulk name conflict returns 400', async () => {
    await boot();
    const conflictName = 'LARGE-conflict';
    jest
      .spyOn(venueTableNames, 'generateTechnicalTableNameEntries')
      .mockReturnValue([{ id: 'id-1', tableName: conflictName }]);
    repository.findAllTableNames.mockResolvedValue([
      { tableName: conflictName },
    ]);

    const res = await request(app.getHttpServer())
      .post('/api/v1/venue-tables/admin/bulk')
      .send({
        quantity: 1,
        size: VenueTableSize.LARGE,
        includedChairs: 6,
        bundlePrice: 100,
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.createManyFromEntries).not.toHaveBeenCalled();
  });

  it('PATCH /admin/:id size change renames via real service', async () => {
    await boot();
    repository.findById.mockResolvedValue(
      makeVenueTableConfigRow({
        id: TABLE_ID,
        size: VenueTableSize.LARGE,
        includedChairs: 8,
        tableName: 'LARGE-11111111',
      }),
    );
    repository.update.mockImplementation((_id: string, data: object) =>
      Promise.resolve(
        makeVenueTableConfigRow({
          id: TABLE_ID,
          size: VenueTableSize.SMALL,
          includedChairs: 4,
          ...data,
        }),
      ),
    );

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/venue-tables/admin/${TABLE_ID}`)
      .send({ size: VenueTableSize.SMALL })
      .expect(200);

    const body = res.body as VenueTableBody;
    expect(body.size).toBe(VenueTableSize.SMALL);
    expect(body.tableName).toBe('SMALL-11111111');
  });

  it('PATCH /admin/bulk-price updates via real service', async () => {
    await boot();
    repository.updateManyActiveBySize.mockResolvedValue({ count: 2 });

    const res = await request(app.getHttpServer())
      .patch('/api/v1/venue-tables/admin/bulk-price')
      .send({
        scope: VenueTableBulkDeleteScope.SIZE,
        size: VenueTableSize.MEDIUM,
        bundlePrice: 160,
      })
      .expect(200);

    const body = res.body as BulkPriceBody;
    expect(body.updatedCount).toBe(2);
    expect(body.size).toBe(VenueTableSize.MEDIUM);
  });

  it('DELETE /admin/:id floor-block returns 400', async () => {
    await boot();
    repository.findById.mockResolvedValue(
      makeVenueTableConfigRow({ id: TABLE_ID }),
    );
    floorLayout.isTablePlacedOnLayout.mockResolvedValue(true);

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/venue-tables/admin/${TABLE_ID}`)
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('DELETE /admin/bulk soft-deletes via real service', async () => {
    await boot();
    repository.bulkDeleteActiveTables.mockResolvedValue({
      size: VenueTableSize.LARGE,
      deletedCount: 3,
    });

    const res = await request(app.getHttpServer())
      .delete('/api/v1/venue-tables/admin/bulk')
      .send({
        scope: VenueTableBulkDeleteScope.SIZE,
        size: VenueTableSize.LARGE,
      })
      .expect(200);

    const body = res.body as BulkDeleteBody;
    expect(body.deletedCount).toBe(3);
    expect(body.size).toBe(VenueTableSize.LARGE);
  });

  it('POST /admin/bulk creates via real service', async () => {
    await boot();
    repository.findAllTableNames.mockResolvedValue([]);
    repository.maxSortOrder.mockResolvedValue(0);
    repository.createManyFromEntries.mockResolvedValue([
      makeVenueTableConfigRow({ id: TABLE_ID, tableName: 'LARGE-aaaaaaaa' }),
    ]);

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
});
