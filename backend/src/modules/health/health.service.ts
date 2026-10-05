import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/errors/api.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { data: { status: 'ready', database: 'connected' } };
    } catch {
      throw new ApiException(
        503,
        'SERVICE_UNAVAILABLE',
        'Không thể kết nối PostgreSQL.',
      );
    }
  }
}
