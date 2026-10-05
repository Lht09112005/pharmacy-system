import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../errors/api.exception.js';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function runFilter(exception: unknown) {
  let statusCode = 0;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(value: unknown) {
      body = value;
      return this;
    },
  } as unknown as Response;
  const request = { method: 'GET', path: '/api/v1/test' } as Request;
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { statusCode, body: body as { error: Record<string, unknown> } };
}

describe('AllExceptionsFilter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the safe business code and details on a conflict', () => {
    const result = runFilter(
      new ApiException(409, 'INSUFFICIENT_STOCK', 'Không đủ tồn', [
        { medicineId: 1, available: 2 },
      ]),
    );
    expect(result.statusCode).toBe(409);
    expect(result.body.error).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Không đủ tồn',
      details: [{ medicineId: 1, available: 2 }],
      path: '/api/v1/test',
    });
    expect(result.body.error.timestamp).toEqual(expect.any(String));
  });

  it('normalizes validation errors into safe field details', () => {
    const result = runFilter(
      new BadRequestException({
        message: [{ property: 'username', constraints: { isString: 'unsafe text' } }],
      }),
    );
    expect(result.statusCode).toBe(400);
    expect(result.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: expect.any(String),
      details: [{ field: 'username', constraints: ['isString'] }],
    });
    expect(JSON.stringify(result.body)).not.toContain('unsafe text');
  });

  it('does not expose unexpected exception text or stack in the response', () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const result = runFilter(new Error('password-or-token-secret'));
    expect(result.statusCode).toBe(500);
    expect(result.body.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi ngoài dự kiến.',
      details: [],
    });
    expect(JSON.stringify(result.body)).not.toContain('password-or-token-secret');
  });

  it('normalizes not found and service unavailable responses', () => {
    const missing = runFilter(new NotFoundException());
    const unavailable = runFilter(
      new ApiException(503, 'SERVICE_UNAVAILABLE', 'CSDL chưa sẵn sàng.'),
    );
    expect(missing.body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: expect.any(String),
      details: [],
    });
    expect(unavailable.statusCode).toBe(503);
    expect(unavailable.body.error).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'CSDL chưa sẵn sàng.',
      details: [],
    });
  });
});
