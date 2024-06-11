import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ApplicationError } from '../errors';

@Catch(ApplicationError)
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name, {
    timestamp: true,
  });

  catch(ex: ApplicationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      success: false,
      error: {
        code: ex.code,
        message: ex.message,
        path: request['url'],
        exception: ex.stack,
        timestamp: new Date().toISOString(),
      },
    };

    if (ex.meta) {
      errorResponse.error['meta'] = ex.meta;
    }

    const method = request['method'];
    const url = request['url'];

    this.logger.error({
      message: `Exception ${method} ${url}`,
      err: ex,
      errorResponse,
    });
    delete errorResponse.error.exception;
    response
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ success: errorResponse.success, ...errorResponse.error });
  }
}
