import { Module } from '@nestjs/common';
import { ElasticModule } from 'src/elasticsearch/elasticsearch.module';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, ElasticModule, UserModule],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
