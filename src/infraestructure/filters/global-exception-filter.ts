import { ArgumentsHost, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { Request, Response } from 'express';

import {
  UnauthorizedException,
  EntityNotFoundException,
  InvalidOperationException,
} from '@/domain/errors/domain-exception';

export default class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    let status: HttpStatus;
    let message: string;
    if (exception instanceof EntityNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
    } else if (exception instanceof InvalidOperationException) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
    } else if (exception instanceof JsonWebTokenError) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
    } else if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
    }
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: message,
      path: request.url,
    });
  }
}
