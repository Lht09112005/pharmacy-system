import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { data: { status: 'ready', database: 'connected' } };
    } catch {
      throw new ServiceUnavailableException('Không thể kết nối PostgreSQL.');
    }
  }
}
