import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  HEALTH_DB_CONNECTED,
  HEALTH_SERVICE_NAME,
} from '../constants/health.constants';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  liveness() {
    return { ok: true as const, service: HEALTH_SERVICE_NAME };
  }

  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true as const, db: HEALTH_DB_CONNECTED };
  }
}
