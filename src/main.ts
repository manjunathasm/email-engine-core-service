import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import * as express from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './common';
import { join } from 'path';

process.env.APPNAME = 'email-engin-core-service';

const env = process.env.NODE_ENV || 'dev';
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

process.setMaxListeners(Infinity);

async function bootstrap() {
  config();

  const logger = new AppLogger(process.env.APPNAME, { timestamp: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger,
  });

  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  //   prefix: 'api/v',
  // });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Innoscripta Api's")
    .setDescription('The Innoscripta APIs description.')
    .setVersion('v1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.enableCors();
  app.disable('etag');

  app.use(helmet());
  app.use(cookieParser());
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  app.useBodyParser('json', { limit: '20mb' });

  // Set up Handlebars as the template engine
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(port, host, () => {
    logger.log(`Server is listening on ${host}:${port} in ${env} mode.`);
  });
}
bootstrap();
