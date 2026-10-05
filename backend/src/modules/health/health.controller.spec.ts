import { HealthController } from './health.controller.js';
import type { HealthService } from './health.service.js';

describe('HealthController', () => {
  it('trả trạng thái liveness mà không phụ thuộc CSDL', () => {
    const service = {} as HealthService;
    const controller = new HealthController(service);

    expect(controller.liveness()).toEqual({
      data: { status: 'ok', service: 'pharmacy-api' },
    });
  });
});
