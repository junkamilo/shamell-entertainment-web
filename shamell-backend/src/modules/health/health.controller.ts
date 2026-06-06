import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  liveness() {
    return { ok: true, service: 'shamell-backend' };
  }

  @Get('ready')
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, db: 'connected' };
  }
}
