import {
  Controller,
  Get,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';

@Controller('obs-probe')
class ObsProbeController {
  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException('probe unauthorized');
  }
}

describe('HTTP observability (e2e smoke)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ObsProbeController],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyHttpObservability(app);
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('echoes generated x-request-id on 401 responses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/obs-probe/unauthorized')
      .expect(401);

    const requestId = res.headers[REQUEST_ID_HEADER];
    expect(typeof requestId).toBe('string');
    expect(String(requestId).length).toBeGreaterThan(0);
    expect(res.body).toEqual(
      expect.objectContaining({
        statusCode: 401,
        message: 'probe unauthorized',
      }),
    );
  });

  it('echoes client-provided x-request-id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/obs-probe/unauthorized')
      .set(REQUEST_ID_HEADER, 'client-fixed-id')
      .expect(401);

    expect(res.headers[REQUEST_ID_HEADER]).toBe('client-fixed-id');
  });
});
