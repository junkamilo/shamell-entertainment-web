import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from '../src/modules/users/controllers/users.controller';

describe('Users (e2e smoke)', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/users/register is forbidden', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/users/register')
      .send({
        fullName: 'Test User',
        email: 'test.user@example.com',
        password: 'password123',
      })
      .expect(403)
      .expect((res) => {
        const body = res.body as { message: string };
        expect(body.message).toBe('Public registration is disabled.');
      });
  });
});
