import { ArgumentsHost, BadRequestException, ExceptionFilter, ForbiddenException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { EntityNotFoundException, InvalidOperationException } from '@/domain/exceptions/domain-exception';

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
    } else if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      body = { message: exception.message };
    } else if (exception instanceof BadRequestException) {
      status = HttpStatus.BAD_REQUEST;
      body = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = { message: exception.message, stack: exception.stack };
    }
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...body,
      path: request.url,
    });
  }
}
