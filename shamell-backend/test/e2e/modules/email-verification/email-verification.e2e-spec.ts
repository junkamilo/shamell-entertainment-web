import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { EmailVerificationController } from '@app/modules/email-verification/controllers/email-verification.controller';
import { EmailVerificationService } from '@app/modules/email-verification/services/email-verification.service';

describe('Email verification flows (e2e)', () => {
  let app: INestApplication;
  
  const mockService = {
    start: jest.fn().mockResolvedValue({ challengeId: 'challenge-1' }),
    verify: jest.fn().mockResolvedValue({ token: 'token-1' }),
    resend: jest.fn().mockResolvedValue({ challengeId: 'challenge-1' }),
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
      ],
      controllers: [EmailVerificationController],
      providers: [
        {
          provide: EmailVerificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /email-verification/start', () => {
    it('is defined', () => {
      expect(app).toBeDefined();
    });
  });
});
