import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/auth/public.decorator.js';
import { HealthService } from './health.service.js';

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  liveness() {
    return { data: { status: 'ok', service: 'pharmacy-api' } };
  }

  @Get('ready')
  readiness() {
    return this.healthService.checkDatabase();
  }
}
