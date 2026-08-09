import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';
import { StandaloneChairsController } from '../src/modules/standalone-chairs/controllers/standalone-chairs.controller';
import { StandaloneChairsService } from '../src/modules/standalone-chairs/services/standalone-chairs.service';

describe('StandaloneChairs (e2e smoke)', () => {
  let app: INestApplication<App>;
  const standaloneChairsService = {
    getPublicStandaloneChairs: jest.fn(),
    getAdminStandaloneChairs: jest.fn(),
    upsertAdminStandaloneChairs: jest.fn(),
    patchAdminStandaloneChair: jest.fn(),
    patchAdminStandaloneChairsBulkPrice: jest.fn(),
    deleteAdminStandaloneChair: jest.fn(),
    deleteAllAdminStandaloneChairs: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/standalone-chairs/admin is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StandaloneChairsController],
      providers: [
        {
          provide: StandaloneChairsService,
          useValue: standaloneChairsService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/standalone-chairs/admin')
      .expect(403);
  });

  it('GET /api/v1/standalone-chairs returns public catalog', async () => {
    jest.clearAllMocks();
    standaloneChairsService.getPublicStandaloneChairs.mockResolvedValue({
      availableQuantity: 1,
      unitPrice: 25,
      chairs: [{ id: 'chair-e2e-1', unitPrice: 25 }],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [StandaloneChairsController],
      providers: [
        {
          provide: StandaloneChairsService,
          useValue: standaloneChairsService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/standalone-chairs')
      .expect(200)
      .expect((res) => {
        const body = res.body as { availableQuantity: number };
        expect(body.availableQuantity).toBe(1);
        expect(
          standaloneChairsService.getPublicStandaloneChairs,
        ).toHaveBeenCalled();
      });
  });
});
