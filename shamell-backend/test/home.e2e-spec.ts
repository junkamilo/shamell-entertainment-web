import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { HomeController } from '../src/modules/home/controllers/home.controller';
import { HomeService } from '../src/modules/home/services/home.service';

describe('Home (e2e smoke)', () => {
  let app: INestApplication<App>;
  const homeService = {
    getAboveFoldData: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/home/above-fold returns aggregated payload', async () => {
    jest.clearAllMocks();
    homeService.getAboveFoldData.mockResolvedValue({
      about: { id: 'about-1', title: 'About' },
      headerPhotos: [],
      headerText: { headline: 'SHAMELL' },
      onComingSettings: { clientEnabled: true },
      upcomingEvents: [],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [{ provide: HomeService, useValue: homeService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/home/above-fold')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          headerText: { headline: string };
          onComingSettings: { clientEnabled: boolean };
        };
        expect(body.headerText.headline).toBe('SHAMELL');
        expect(body.onComingSettings.clientEnabled).toBe(true);
        expect(homeService.getAboveFoldData).toHaveBeenCalled();
      });
  });
});
