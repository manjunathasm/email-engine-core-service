import { Module } from '@nestjs/common';
import { FrontendController } from './frontend.controller';
import { ElasticModule } from 'src/elasticsearch/elasticsearch.module';

@Module({
  imports: [ElasticModule],
  controllers: [FrontendController],
})
export class FrontendModule {}
