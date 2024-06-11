import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { ElasticModule } from 'src/elasticsearch/elasticsearch.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, ElasticModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
