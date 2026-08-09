import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  liveness() {
    return this.healthService.liveness();
  }

  @Get('ready')
  readiness() {
    return this.healthService.readiness();
  }
}
