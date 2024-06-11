import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppExceptionFilter } from './filters/app-exception.filter';
import { ErrorExceptionFilter } from './filters/error-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ConfigService } from './services';

@Module({
  imports: [],
  providers: [
    {
      provide: ConfigService,
      useValue: new ConfigService(),
    },
    {
      provide: APP_FILTER,
      useClass: ErrorExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [ConfigService],
})
export class CommonModule {}
