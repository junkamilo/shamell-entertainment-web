import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import {
  makeFloorLayoutMapped,
  makeFloorLayoutPalette,
} from '../src/modules/floor-layout/__mocks__/floor-layout.fixtures';
import { createFloorLayoutServiceMock } from '../src/modules/floor-layout/__mocks__/floor-layout.service.mock';
import { createFloorLayoutHttpApp } from '../src/modules/floor-layout/testing/floor-layout-http-app';
import type {
  ErrorBody,
  FloorLayoutBody,
  PaletteBody,
} from '../src/modules/floor-layout/testing/floor-layout.test-types';

describe('FloorLayout (contract e2e)', () => {
  let app: INestApplication<App>;
  const floorLayoutService = createFloorLayoutServiceMock();

  afterEach(async () => {
    await app.close();
  });

  describe('admin routes without JWT (guardsAllow: false)', () => {
    beforeEach(async () => {
      const created = await createFloorLayoutHttpApp({
        guardsAllow: false,
        floorLayoutService,
      });
      app = created.app;
    });

    it('GET /admin returns 401 or 403', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/floor-layout/admin')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
      const body = res.body as ErrorBody;
      expect(body.statusCode).toBe(res.status);
    });

    it('GET /admin/palette returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/floor-layout/admin/palette')
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });

    it('PUT /admin returns 401 or 403', async () => {
      await request(app.getHttpServer())
        .put('/api/v1/floor-layout/admin')
        .send({ items: [] })
        .expect((response) => {
          expect([401, 403]).toContain(response.status);
        });
    });
  });

  describe('public + admin with guardsAllow true', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
      const created = await createFloorLayoutHttpApp({
        guardsAllow: true,
        floorLayoutService,
      });
      app = created.app;
    });

    it('GET /floor-layout returns typed public layout', async () => {
      floorLayoutService.getPublicFloorLayout.mockResolvedValue(
        makeFloorLayoutMapped({ id: 'layout-e2e-1', items: [] }),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/floor-layout')
        .expect(200);

      const body = res.body as FloorLayoutBody;
      expect(body.id).toBe('layout-e2e-1');
      expect(body.items).toEqual([]);
      expect(body.isDefault).toBe(false);
      expect(floorLayoutService.getPublicFloorLayout).toHaveBeenCalled();
    });

    it('GET /admin returns typed admin layout', async () => {
      floorLayoutService.getAdminFloorLayout.mockResolvedValue(
        makeFloorLayoutMapped(),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/floor-layout/admin')
        .expect(200);

      const body = res.body as FloorLayoutBody;
      expect(body.id).toBe('layout-1');
      expect(body.viewBoxWidth).toBe(614);
      expect(floorLayoutService.getAdminFloorLayout).toHaveBeenCalled();
    });

    it('GET /admin/palette returns typed palette', async () => {
      floorLayoutService.getAdminPalette.mockResolvedValue(
        makeFloorLayoutPalette(),
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/floor-layout/admin/palette')
        .expect(200);

      const body = res.body as PaletteBody;
      expect(body.tablesBySize.LARGE).toBe(1);
      expect(body.unplacedTables[0]?.id).toBe('table-2');
      expect(body.placedTableIds).toEqual(['table-1']);
      expect(floorLayoutService.getAdminPalette).toHaveBeenCalled();
    });

    it('PUT /admin upserts via service mock', async () => {
      floorLayoutService.upsertAdminFloorLayout.mockResolvedValue(
        makeFloorLayoutMapped({ id: 'layout-saved' }),
      );

      const res = await request(app.getHttpServer())
        .put('/api/v1/floor-layout/admin')
        .send({ items: [] })
        .expect(200);

      const body = res.body as FloorLayoutBody;
      expect(body.id).toBe('layout-saved');
      expect(floorLayoutService.upsertAdminFloorLayout).toHaveBeenCalledWith(
        expect.objectContaining({ items: [] }),
      );
    });

    it('attaches request id header on public GET', async () => {
      floorLayoutService.getPublicFloorLayout.mockResolvedValue(
        makeFloorLayoutMapped({ items: [] }),
      );
      const res = await request(app.getHttpServer())
        .get('/api/v1/floor-layout')
        .expect(200);
      expect(res.headers[REQUEST_ID_HEADER]).toBeTruthy();
    });
  });
});
