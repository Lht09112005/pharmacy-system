import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../errors/api.exception.js';

const statusCodes: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'STATE_CONFLICT',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

const statusMessages: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Yêu cầu không hợp lệ.',
  [HttpStatus.UNAUTHORIZED]: 'Bạn cần đăng nhập để tiếp tục.',
  [HttpStatus.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này.',
  [HttpStatus.NOT_FOUND]: 'Không tìm thấy tài nguyên yêu cầu.',
  [HttpStatus.CONFLICT]: 'Dữ liệu hiện tại không cho phép thao tác này.',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Bạn đã gửi quá nhiều yêu cầu.',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Dịch vụ hiện chưa sẵn sàng.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Đã xảy ra lỗi ngoài dự kiến.',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    let code = statusCodes[status] ?? `HTTP_${status}`;
    let message = statusMessages[status] ?? 'Yêu cầu không hợp lệ.';
    let details: unknown[] = [];

    if (exception instanceof ApiException) {
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (isHttpException && status === HttpStatus.BAD_REQUEST) {
      const body = exception.getResponse();
      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body &&
        Array.isArray(body.message)
      ) {
        code = 'VALIDATION_ERROR';
        message = 'Dữ liệu gửi lên không hợp lệ.';
        details = body.message.map((item: unknown) => {
          if (typeof item !== 'object' || item === null) {
            return { field: 'request', constraints: [] };
          }
          const validationError = item as {
            property?: unknown;
            constraints?: unknown;
          };
          const constraints =
            typeof validationError.constraints === 'object' &&
            validationError.constraints !== null
              ? Object.keys(validationError.constraints)
              : [];
          return {
            field:
              typeof validationError.property === 'string'
                ? validationError.property
                : 'request',
            constraints,
          };
        });
      }
    } else if (!isHttpException || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const name =
        typeof exception === 'object' && exception !== null && 'name' in exception
          ? String(exception.name)
          : typeof exception;
      const stack =
        typeof exception === 'object' && exception !== null && 'stack' in exception
          ? String(exception.stack)
          : '';
      this.logger.error(
        `Unhandled exception (${name}) for ${request.method} ${request.path}`,
        stack.split('\n').slice(1, 8).join('\n'),
      );
    }

    response.status(status).json({
      error: {
        code,
        message: typeof message === 'string' ? message : 'Đã xảy ra lỗi.',
        details: Array.isArray(details) ? details : [],
        path: request.path,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
