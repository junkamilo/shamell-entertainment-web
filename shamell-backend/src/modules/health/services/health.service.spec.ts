import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  HEALTH_DB_CONNECTED,
  HEALTH_SERVICE_NAME,
} from '../constants/health.constants';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(HealthService);
  });

  it('liveness returns ok and service name', () => {
    expect(service.liveness()).toEqual({
      ok: true,
      service: HEALTH_SERVICE_NAME,
    });
  });

  it('readiness queries DB and returns connected', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(service.readiness()).resolves.toEqual({
      ok: true,
      db: HEALTH_DB_CONNECTED,
    });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('readiness propagates Prisma errors', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));
    await expect(service.readiness()).rejects.toThrow('db down');
  });
});
