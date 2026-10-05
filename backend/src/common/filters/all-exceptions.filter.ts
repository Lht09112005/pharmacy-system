import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.getMessage(exceptionResponse, status);

    response.status(status).json({
      error: {
        code: this.getCode(status),
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      },
    });
  }

  private getMessage(value: string | object | undefined, status: number) {
    if (typeof value === 'string') return value;
    if (value && 'message' in value) return value.message;
    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Đã xảy ra lỗi ngoài dự kiến.'
      : 'Yêu cầu không hợp lệ.';
  }

  private getCode(status: number) {
    if (status === HttpStatus.SERVICE_UNAVAILABLE) return 'SERVICE_UNAVAILABLE';
    if (status === HttpStatus.NOT_FOUND) return 'NOT_FOUND';
    if (status === HttpStatus.BAD_REQUEST) return 'VALIDATION_ERROR';
    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'INTERNAL_ERROR'
      : `HTTP_${status}`;
  }
}
