import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ContactController } from '../src/modules/contact/controllers/contact.controller';
import { ContactService } from '../src/modules/contact/services/contact.service';
import { AdminJwtGuard } from '../src/common/auth/admin-jwt.guard';

describe('Contact (e2e smoke)', () => {
  let app: INestApplication<App>;
  const contactService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllPeticiones: jest.fn(),
    countPeticionesBadge: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
    updateStatus: jest.fn(),
    remove: jest.fn(),
  };

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/contact creates via mocked service', async () => {
    jest.clearAllMocks();
    contactService.create.mockResolvedValue({
      id: 'contact-e2e-1',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Reservation inquiry',
      message: 'Hello',
      status: 'PENDING',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: contactService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .post('/api/v1/contact')
      .send({
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'Hello',
      })
      .expect(201)
      .expect((res) => {
        const body = res.body as { id: string };
        expect(body.id).toBe('contact-e2e-1');
        expect(contactService.create).toHaveBeenCalled();
      });
  });

  it('GET /api/v1/contact is forbidden without auth', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: contactService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => false })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/contact').expect(403);
  });

  it('GET /api/v1/contact/peticiones/badge returns count when auth allowed', async () => {
    jest.clearAllMocks();
    contactService.countPeticionesBadge.mockResolvedValue({ count: 7 });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: contactService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    await request(app.getHttpServer())
      .get('/api/v1/contact/peticiones/badge')
      .query({ lane: 'bookings' })
      .expect(200)
      .expect((res) => {
        const body = res.body as { count: number };
        expect(body.count).toBe(7);
      });
  });
});
