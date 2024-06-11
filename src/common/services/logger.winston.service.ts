import 'winston-daily-rotate-file';

import {
  ConsoleLogger,
  HttpException,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { Request } from 'express';
import { WinstonModule } from 'nest-winston';

import { ApplicationError } from '../errors';

import winston = require('winston');

Injectable();
export class AppLogger extends ConsoleLogger implements LoggerService {
  private readonly logger;
  context?: string;
  public constructor(context?: string, options?: { timestamp?: boolean }) {
    super(context, options);
    if (process.env.APPNAME === undefined) {
      process.env.APPNAME = process.env.NAME || 'unset-service-name';
    }

    let outputLogFormat = [
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) =>
          `${info.timestamp} [${info.level}]: [${info.context}] ${info.message}`,
      ),
    ];
    if (process.env.OUTPUT_LOG_FORMAT === 'json') {
      outputLogFormat = [winston.format.json()];
    }

    const ignorePrivateIncludeSeverity = winston.format((out) => {
      if (out.private || out.ignore) {
        return false;
      }
      out.severity = out.level;
      out['jio.log.severity'] = out.level;
      return out;
    });

    this.logger = WinstonModule.createLogger({
      level: process.env.OUTPUT_LOG_LEVEL || 'debug',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        ignorePrivateIncludeSeverity(),
        ...outputLogFormat,
      ),
      defaultMeta: {
        Appname: process.env.APPNAME || 'jio-unset',
      },
      transports: [
        // Console log
        new winston.transports.Console({
          level: 'debug',
          handleExceptions: true,
        }),

        // files log
        ...(process.env.LOGFILE
          ? [
              new winston.transports.DailyRotateFile({
                filename: 'log/error/error.log',
                level: 'error',
                maxFiles: '1d',
              }),
              new winston.transports.DailyRotateFile({
                filename: 'log/app-%DATE%.log',
                datePattern: 'YYYY-MM-DD-HH',
                maxFiles: '1d',
              }),
            ]
          : []),
      ],

      exceptionHandlers: [new winston.transports.Console()],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  error(message: string, trace?: string, context?: string): void {
    context = context || this.context;
    this.logger.error(message, context);
  }

  log(message: string, context?: string): void {
    context = context || this.context;
    this.logger.log(message, context);
  }

  warn(message: string, context?: string): void {
    context = context || this.context;
    this.logger.warn(message, context);
  }

  info(message: string, context?: string): void {
    context = context || this.context;
    this.logger.info(message, context);
  }

  debug(message: string, context?: string): void {
    context = context || this.context;
    this.logger.debug(message, context);
  }

  logError(
    request: Request,
    error: Error | ApplicationError | HttpException,
  ): void {
    this.warn(
      JSON.stringify({
        method: request.method,
        url: request.url,
        params: request.params,
        body: request.body,
        query: request.query,
        error: {
          name: error.constructor.name,
          message: error.message,
        },
      }),
      this.context,
    );
  }

  logResponse(request: Request, payload: unknown): void {
    this.log(
      JSON.stringify({
        method: request.method,
        url: request.url,
        params: request.params,
        body: request.body,
        query: request.query,
        // file: request.file,
        data: payload,
      }),
    );
  }
}
