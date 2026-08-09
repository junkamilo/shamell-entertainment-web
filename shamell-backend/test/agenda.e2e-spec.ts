import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AgendaController } from '../src/modules/agenda/controllers/agenda.controller';
import { AgendaService } from '../src/modules/agenda/services/agenda.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Agenda (e2e smoke)', () => {
  let app: INestApplication<App>;
  const agendaService = {
    getHubBadges: jest.fn(),
    getAgendarCatalog: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/agenda/hub-badges is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: agendaService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/agenda/hub-badges')
      .expect(403);
  });

  it('GET /api/v1/agenda/agendar/catalog returns catalog when guard allows', async () => {
    jest.clearAllMocks();
    agendaService.getAgendarCatalog.mockResolvedValue({
      services: [],
      eventTypes: [],
      occasions: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [{ provide: AgendaService, useValue: agendaService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/agenda/agendar/catalog')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          services: unknown[];
          eventTypes: unknown[];
          occasions: unknown[];
        };
        expect(body.services).toEqual([]);
        expect(body.eventTypes).toEqual([]);
        expect(body.occasions).toEqual([]);
      });
  });
});
