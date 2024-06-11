import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticService } from './eleasticsearch.service';
import { MailboxMonitorService } from './mailbox-monitor.service';

@Module({
  imports: [
    ConfigModule,
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get<string>('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get<string>('ELASTICSEARCH_USERNAME'),
          password: configService.get<string>('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [ElasticService, MailboxMonitorService],
  exports: [ElasticService, MailboxMonitorService],
})
export class ElasticModule {
  constructor(private readonly elasticService: ElasticService) {}
  public async onModuleInit() {
    await this.elasticService.createIndex();
  }
}
