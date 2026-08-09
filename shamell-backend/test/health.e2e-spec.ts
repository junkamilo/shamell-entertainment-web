import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthController } from '../src/modules/health/controllers/health.controller';
import { HealthService } from '../src/modules/health/services/health.service';

describe('Health (e2e smoke)', () => {
  let app: INestApplication<App>;
  const healthService = {
    liveness: jest.fn(),
    readiness: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  async function createApp() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  }

  it('GET /api/v1/health returns liveness', async () => {
    jest.clearAllMocks();
    healthService.liveness.mockReturnValue({
      ok: true,
      service: 'shamell-backend',
    });
    await createApp();

    await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as { ok: boolean };
        expect(body.ok).toBe(true);
        expect(healthService.liveness).toHaveBeenCalled();
      });
  });

  it('GET /api/v1/health/ready returns readiness', async () => {
    jest.clearAllMocks();
    healthService.readiness.mockResolvedValue({
      ok: true,
      db: 'connected',
    });
    await createApp();

    await request(app.getHttpServer())
      .get('/api/v1/health/ready')
      .expect(200)
      .expect((res) => {
        const body = res.body as { ok: boolean; db: string };
        expect(body.ok).toBe(true);
        expect(body.db).toBe('connected');
        expect(healthService.readiness).toHaveBeenCalled();
      });
  });
});
