import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeFloorLayoutRow,
  makePlacedCatalogTable,
} from '../src/modules/floor-layout/__mocks__/floor-layout.fixtures';
import { createFloorLayoutServiceMock } from '../src/modules/floor-layout/__mocks__/floor-layout.service.mock';
import { createFloorLayoutHttpApp } from '../src/modules/floor-layout/testing/floor-layout-http-app';
import { createFloorLayoutServiceTestModule } from '../src/modules/floor-layout/testing/floor-layout-service.test-module';
import type {
  FloorLayoutBody,
  PaletteBody,
} from '../src/modules/floor-layout/testing/floor-layout.test-types';

const TABLE_ID = '11111111-1111-4111-8111-111111111111';
const ITEM_ID = '22222222-2222-4222-8222-222222222222';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createFloorLayoutServiceTestModule>
  >['repository'];
};

async function createDeepFloorLayoutHttpApp(): Promise<DeepHarness> {
  const harness = await createFloorLayoutServiceTestModule();
  const floorLayoutService = {
    ...createFloorLayoutServiceMock(),
    getPublicFloorLayout: () => harness.service.getPublicFloorLayout(),
    getAdminFloorLayout: () => harness.service.getAdminFloorLayout(),
    getAdminPalette: () => harness.service.getAdminPalette(),
    upsertAdminFloorLayout: (dto: unknown) =>
      harness.service.upsertAdminFloorLayout(
        dto as Parameters<typeof harness.service.upsertAdminFloorLayout>[0],
      ),
  };

  const { app } = await createFloorLayoutHttpApp({
    guardsAllow: true,
    floorLayoutService,
  });

  return {
    app,
    repository: harness.repository,
  };
}

describe('FloorLayout admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepFloorLayoutHttpApp();
    app = created.app;
    repository = created.repository;
  }

  it('GET /admin/palette via real FloorLayoutService', async () => {
    await boot();
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({
        items: [makePlacedCatalogTable({ venueTableConfigId: TABLE_ID })],
      }),
    );
    repository.findActiveChairsForPalette.mockResolvedValue([
      { id: 'chair-1', chairName: 'CHAIR-1', unitPrice: 25, sortOrder: 0 },
    ]);
    repository.findActiveTablesForPalette.mockResolvedValue([
      {
        id: TABLE_ID,
        tableName: 'LARGE-1',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
      {
        id: 'table-free',
        tableName: 'MEDIUM-1',
        size: 'MEDIUM',
        includedChairs: 6,
        sortOrder: 1,
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/floor-layout/admin/palette')
      .expect(200);

    const body = res.body as PaletteBody;
    expect(body.placedTableIds).toEqual([TABLE_ID]);
    expect(body.tablesBySize.MEDIUM).toBe(1);
    expect(body.tablesBySize.LARGE).toBe(0);
    expect(body.unplacedTables).toHaveLength(1);
    expect(body.unplacedTables[0]?.id).toBe('table-free');
    expect(body.standaloneChairsAvailable).toBe(1);
  });

  it('PUT /admin upserts via real FloorLayoutService', async () => {
    await boot();
    repository.findAllActiveTables.mockResolvedValue([
      {
        id: TABLE_ID,
        tableName: 'LARGE-1',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
    ]);
    repository.findAllActiveStandaloneChairs.mockResolvedValue([]);
    repository.findActiveLayout.mockResolvedValue(null);
    repository.upsertLayoutWithSideEffects.mockResolvedValue(
      makeFloorLayoutRow({
        id: 'layout-deep-1',
        items: [
          makePlacedCatalogTable({
            id: ITEM_ID,
            venueTableConfigId: TABLE_ID,
          }),
        ],
      }),
    );

    const res = await request(app.getHttpServer())
      .put('/api/v1/floor-layout/admin')
      .send({
        items: [
          {
            id: ITEM_ID,
            kind: 'catalog_table',
            venueTableConfigId: TABLE_ID,
            x: 120,
            y: 240,
            rotation: 0,
          },
        ],
      })
      .expect(200);

    const body = res.body as FloorLayoutBody;
    expect(body.id).toBe('layout-deep-1');
    expect(repository.upsertLayoutWithSideEffects).toHaveBeenCalled();
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'catalog_table',
          venueTableConfigId: TABLE_ID,
        }),
      ]),
    );
  });
});
