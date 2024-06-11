import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApplicationError } from '../errors';
import { Allow } from 'class-validator';

export class ErrorDto {
  @Allow()
  code: string;

  @Allow()
  message: string;

  @Allow()
  meta: string;

  @Allow()
  lang: string;

  @Allow()
  exception: string;

  @Allow()
  traceId: string;

  @Allow()
  helpUrl: string;

  @Allow()
  path: string;

  @Allow()
  timestamp: string;
}

@Catch()
export class ErrorExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorExceptionFilter.name, {
    timestamp: true,
  });
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    this.logger.debug(
      `ErrorExceptionsFilter ${exception.name} ${JSON.stringify(exception)}`,
    );

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const error = new ErrorDto();

    // TODO: Get language from request and return the message accordingly.
    error.lang = 'en';
    error.path = request.url;
    error.timestamp = new Date().toISOString();
    error.exception = JSON.stringify(exception);

    let status = exception['status'] || HttpStatus.INTERNAL_SERVER_ERROR;
    let code = exception.code;
    let message = exception['response']?.message || exception.message;
    if (exception.name === 'ValidationError') {
      status = HttpStatus.BAD_REQUEST;
      code = 'validation_error';
      message = message;
    } else if (status == HttpStatus.UNAUTHORIZED) {
      code = code || 'server_error';
      message = message || 'Unauthorized';
    } else if (status == HttpStatus.FORBIDDEN) {
      code = code || 'server_error';
      message = message || 'Forbidden';
    } else if (exception.name === 'BadRequestException') {
      code = code || 'server_error';
      message = message || 'Bad Request Exception';
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = code || 'server_error';
      message = message || 'Internal Server Error';
    }

    error.code = `${code}`;
    error.message = `${[message].flat()}`;

    if (exception.meta) {
      error.meta = exception.meta;
    }

    delete error.exception;
    response.status(status).json({
      success: false,
      ...error,
    });
  }
}
