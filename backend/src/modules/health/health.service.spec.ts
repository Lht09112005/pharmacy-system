import { ApiException } from '../../common/errors/api.exception.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HealthService } from './health.service.js';

describe('HealthService', () => {
  it('reports database unavailability using the shared 503 code', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);

    let thrown: unknown;
    try {
      await service.checkDatabase();
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(ApiException);
    const error = thrown as ApiException;
    expect(error.getStatus()).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.details).toEqual([]);
  });
});
