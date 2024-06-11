import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name, {
    timestamp: true,
  });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    try {
      url !== '/api/v1' &&
        this.logger.log({
          req,
          message: `${context.getClass().name} ${method} ${url}`,
        });
    } catch (err) {
      this.logger.error(`error logging`);
    }
    return next.handle().pipe(
      tap(() => {
        try {
          const res = context.switchToHttp().getResponse();
          url !== '/api/v1' &&
            this.logger.log({
              res,
              message: `${context.getClass().name} ${method} ${url} ${
                res.statusCode
              } ${Date.now() - now}ms`,
            });
        } catch (err) {
          this.logger.error(err);
        }
      }),
    );
  }
}
