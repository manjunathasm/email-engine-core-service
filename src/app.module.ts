import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { FrontendModule } from './frontend/frontend.module';
import { CommonModule } from './common';
import { HttpModule } from '@nestjs/axios';
import { ElasticModule } from './elasticsearch/elasticsearch.module';
import { EmailModule } from './email/email.module';
import { RateLimiterGuard, RateLimiterModule } from 'nestjs-rate-limiter';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    RateLimiterModule,
    HttpModule,
    CommonModule,
    AuthModule,
    ElasticModule,
    EmailModule,
    FrontendModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
  ],
})
export class AppModule {}
