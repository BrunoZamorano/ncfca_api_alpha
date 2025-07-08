import { ArgumentsHost, BadRequestException, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { Request, Response } from 'express';

import {
  UnauthorizedException,
  EntityNotFoundException,
  InvalidOperationException,
} from '@/domain/exceptions/domain-exception';

export default class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    let status: HttpStatus;
    let body: any;
    if (exception instanceof EntityNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      body = { message: exception.message };
    } else if (exception instanceof InvalidOperationException) {
      status = HttpStatus.BAD_REQUEST;
      body = { message: exception.message };
    } else if (exception instanceof JsonWebTokenError) {
      status = HttpStatus.UNAUTHORIZED;
      body = { message: exception.message };
    } else if (exception instanceof UnauthorizedException) {
      status = HttpStatus.UNAUTHORIZED;
      body = { message: exception.message };
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      body = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { message: 'INTERNAL_SERVER_ERROR' };
    }
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...body,
      path: request.url,
    });
  }
}
