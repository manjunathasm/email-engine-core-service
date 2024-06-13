import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';
import { OutlookStrategy } from './auth-strategy.outlook';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { WebhookService } from 'src/webhook/webhook.service';

@Module({
  imports: [ConfigModule, PassportModule, HttpModule, UserModule],
  controllers: [AuthController],
  providers: [OutlookStrategy, AuthService, WebhookService],
  exports: [AuthService],
})
export class AuthModule {}
