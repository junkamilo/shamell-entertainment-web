import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  makeChairConfig,
  makeChairRow,
  makeLayoutChairItem,
  makePaidReservation,
} from '../src/modules/standalone-chairs/__mocks__/standalone-chairs.fixtures';
import { createStandaloneChairsServiceMock } from '../src/modules/standalone-chairs/__mocks__/standalone-chairs.service.mock';
import { createStandaloneChairsHttpApp } from '../src/modules/standalone-chairs/testing/standalone-chairs-http-app';
import { createStandaloneChairsServiceTestModule } from '../src/modules/standalone-chairs/testing/standalone-chairs-service.test-module';
import type {
  AdminStandaloneChairsBody,
  ErrorBody,
  PublicStandaloneChairsBody,
} from '../src/modules/standalone-chairs/testing/standalone-chairs.test-types';

const CHAIR_ID = '11111111-1111-4111-8111-111111111111';
const CHAIR_ID_2 = '22222222-2222-4222-8222-222222222222';

type DeepHarness = {
  app: INestApplication<App>;
  repository: Awaited<
    ReturnType<typeof createStandaloneChairsServiceTestModule>
  >['repository'];
  floorLayout: Awaited<
    ReturnType<typeof createStandaloneChairsServiceTestModule>
  >['floorLayout'];
};

async function createDeepStandaloneChairsHttpApp(): Promise<DeepHarness> {
  const harness = await createStandaloneChairsServiceTestModule();
  const standaloneChairsService = {
    ...createStandaloneChairsServiceMock(),
    getPublicStandaloneChairs: () =>
      harness.service.getPublicStandaloneChairs(),
    getAdminStandaloneChairs: () => harness.service.getAdminStandaloneChairs(),
    upsertAdminStandaloneChairs: (dto: unknown) =>
      harness.service.upsertAdminStandaloneChairs(
        dto as Parameters<
          typeof harness.service.upsertAdminStandaloneChairs
        >[0],
      ),
    patchAdminStandaloneChair: (id: string, dto: unknown) =>
      harness.service.patchAdminStandaloneChair(
        id,
        dto as Parameters<typeof harness.service.patchAdminStandaloneChair>[1],
      ),
    patchAdminStandaloneChairsBulkPrice: (dto: unknown) =>
      harness.service.patchAdminStandaloneChairsBulkPrice(
        dto as Parameters<
          typeof harness.service.patchAdminStandaloneChairsBulkPrice
        >[0],
      ),
    deleteAdminStandaloneChair: (id: string) =>
      harness.service.deleteAdminStandaloneChair(id),
    deleteAllAdminStandaloneChairs: () =>
      harness.service.deleteAllAdminStandaloneChairs(),
  };

  const { app } = await createStandaloneChairsHttpApp({
    guardsAllow: true,
    standaloneChairsService,
  });

  return {
    app,
    repository: harness.repository,
    floorLayout: harness.floorLayout,
  };
}

describe('StandaloneChairs admin flows (deep e2e)', () => {
  let app: INestApplication<App>;
  let repository: DeepHarness['repository'];
  let floorLayout: DeepHarness['floorLayout'];

  afterEach(async () => {
    await app.close();
  });

  async function boot() {
    const created = await createDeepStandaloneChairsHttpApp();
    app = created.app;
    repository = created.repository;
    floorLayout = created.floorLayout;
  }

  function stubAdminList(
    chairs = [makeChairRow({ id: CHAIR_ID })],
    config = makeChairConfig({ availableQuantity: chairs.length }),
  ) {
    repository.findActiveConfig.mockResolvedValue(config);
    repository.countActiveChairs.mockResolvedValue(chairs.length);
    repository.findActiveChairs.mockResolvedValue(chairs);
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
  }

  it('PUT /admin increases quantity via real StandaloneChairsService', async () => {
    await boot();
    repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
    repository.findActiveChairsDesc.mockResolvedValue([
      makeChairRow({ id: CHAIR_ID }),
    ]);
    repository.maxSortOrder.mockResolvedValue(0);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 1 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminList([
      makeChairRow({ id: CHAIR_ID }),
      makeChairRow({ id: CHAIR_ID_2, sortOrder: 1 }),
    ]);

    const res = await request(app.getHttpServer())
      .put('/api/v1/standalone-chairs/admin')
      .send({ availableQuantity: 2, unitPrice: 25 })
      .expect(200);

    const body = res.body as AdminStandaloneChairsBody;
    expect(body.availableQuantity).toBe(2);
    expect(repository.createChairsFromEntries).toHaveBeenCalled();
  });

  it('PUT /admin reduce blocked when chairs are on floor plan', async () => {
    await boot();
    repository.getPlacedStandaloneChairIds.mockResolvedValue(
      new Set([CHAIR_ID, CHAIR_ID_2]),
    );
    repository.findActiveChairsDesc.mockResolvedValue([
      makeChairRow({ id: CHAIR_ID_2, sortOrder: 1 }),
      makeChairRow({ id: CHAIR_ID }),
    ]);

    const res = await request(app.getHttpServer())
      .put('/api/v1/standalone-chairs/admin')
      .send({ availableQuantity: 0, unitPrice: 25 })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.deleteChairsByIds).not.toHaveBeenCalled();
  });

  it('PATCH /admin/:id blocks reserved chair price change', async () => {
    await boot();
    repository.findActiveChairById.mockResolvedValue(
      makeChairRow({ id: CHAIR_ID }),
    );
    repository.getActiveLayoutItems.mockResolvedValue([
      makeLayoutChairItem({
        venueStandaloneChairId: CHAIR_ID,
        id: 'layout-item-1',
      }),
    ]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation({ layoutItemId: 'layout-item-1' }),
    ]);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
      .send({ unitPrice: 40 })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.updateChairUnitPrice).not.toHaveBeenCalled();
  });

  it('PATCH /admin/bulk-price syncs layout via real service', async () => {
    await boot();
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.findActiveChairIds.mockResolvedValue([
      { id: CHAIR_ID },
      { id: CHAIR_ID_2 },
    ]);
    repository.updateAllActiveUnitPrices.mockResolvedValue(undefined);
    stubAdminList(
      [
        makeChairRow({ id: CHAIR_ID, unitPrice: 55 }),
        makeChairRow({ id: CHAIR_ID_2, unitPrice: 55, sortOrder: 1 }),
      ],
      makeChairConfig({ availableQuantity: 2, unitPrice: 55 }),
    );

    const res = await request(app.getHttpServer())
      .patch('/api/v1/standalone-chairs/admin/bulk-price')
      .send({ unitPrice: 55 })
      .expect(200);

    const body = res.body as AdminStandaloneChairsBody;
    expect(body.unitPrice).toBe(55);
    expect(
      floorLayout.syncStandaloneChairUnitPricesInActiveLayout,
    ).toHaveBeenCalled();
  });

  it('DELETE /admin/:id cleans layout references via real service', async () => {
    await boot();
    repository.findActiveChairById.mockResolvedValue(
      makeChairRow({ id: CHAIR_ID }),
    );
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.deleteChair.mockResolvedValue(undefined);
    repository.countActiveChairs.mockResolvedValue(0);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 1 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminList([], makeChairConfig({ availableQuantity: 0 }));

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/standalone-chairs/admin/${CHAIR_ID}`)
      .expect(200);

    const body = res.body as AdminStandaloneChairsBody;
    expect(body.totalCount).toBe(0);
    expect(
      repository.cleanupDeletedChairReferencesFromLayout,
    ).toHaveBeenCalledWith([CHAIR_ID]);
  });

  it('DELETE /admin/all blocks when reserved chairs exist', async () => {
    await boot();
    repository.getActiveLayoutItems.mockResolvedValue([
      makeLayoutChairItem({
        venueStandaloneChairId: CHAIR_ID,
        id: 'layout-item-1',
      }),
    ]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation({ layoutItemId: 'layout-item-1' }),
    ]);
    repository.findActiveChairIds.mockResolvedValue([{ id: CHAIR_ID }]);

    const res = await request(app.getHttpServer())
      .delete('/api/v1/standalone-chairs/admin/all')
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(repository.deleteChairsByIds).not.toHaveBeenCalled();
  });

  it('GET /standalone-chairs materializes legacy config via real service', async () => {
    await boot();
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 2 }),
    );
    repository.countActiveChairs
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveChairsPublic.mockResolvedValue([
      makeChairRow({ id: CHAIR_ID }),
      makeChairRow({ id: CHAIR_ID_2, sortOrder: 1 }),
    ]);

    const res = await request(app.getHttpServer())
      .get('/api/v1/standalone-chairs')
      .expect(200);

    const body = res.body as PublicStandaloneChairsBody;
    expect(body.availableQuantity).toBe(2);
    expect(repository.createChairsFromEntries).toHaveBeenCalled();
  });

  it('DELETE /admin/all deletes via deleteChairsByIds when none reserved', async () => {
    await boot();
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.findActiveChairIds.mockResolvedValue([
      { id: CHAIR_ID },
      { id: CHAIR_ID_2 },
    ]);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.deleteChairsByIds.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 2 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminList([], makeChairConfig({ availableQuantity: 0 }));

    const res = await request(app.getHttpServer())
      .delete('/api/v1/standalone-chairs/admin/all')
      .expect(200);

    const body = res.body as AdminStandaloneChairsBody;
    expect(body.totalCount).toBe(0);
    expect(repository.deleteChairsByIds).toHaveBeenCalledWith([
      CHAIR_ID,
      CHAIR_ID_2,
    ]);
  });

  it('PUT /admin reduce calls deleteChairsByIds for removable chairs', async () => {
    await boot();
    repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
    repository.findActiveChairsDesc.mockResolvedValue([
      makeChairRow({ id: CHAIR_ID_2, sortOrder: 1 }),
      makeChairRow({ id: CHAIR_ID }),
    ]);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 2 }),
    );
    repository.deleteChairsByIds.mockResolvedValue(undefined);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminList(
      [makeChairRow({ id: CHAIR_ID })],
      makeChairConfig({ availableQuantity: 1 }),
    );

    const res = await request(app.getHttpServer())
      .put('/api/v1/standalone-chairs/admin')
      .send({ availableQuantity: 1, unitPrice: 25 })
      .expect(200);

    const body = res.body as AdminStandaloneChairsBody;
    expect(body.availableQuantity).toBe(1);
    expect(repository.deleteChairsByIds).toHaveBeenCalled();
  });
});
