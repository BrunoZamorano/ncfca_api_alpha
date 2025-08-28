import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  ExceptionFilter,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { Request, Response } from 'express';

import { DomainException, EntityNotFoundException, InvalidOperationException, OptimisticLockError } from '@/domain/exceptions/domain-exception';

//todo: align to ocp (open closed principle) and use chain of responsibility pattern to handle the error handling. then we will extend the functionality, not only add ifs on a class. we may have a folder shared/exceptions/ and there is the place of our exceptions.
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
    } else if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      body = { message: exception.message };
    } else if (exception instanceof InvalidOperationException) {
      status = HttpStatus.BAD_REQUEST;
      body = { message: exception.message };
    } else if (exception instanceof OptimisticLockError) {
      status = HttpStatus.CONFLICT;
      body = { message: exception.message };
    } else if (exception instanceof DomainException) {
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
    } else if (exception instanceof ConflictException) {
      status = HttpStatus.CONFLICT;
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
