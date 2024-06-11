import { Injectable } from '@nestjs/common';
import { MailboxMonitorService } from 'src/elasticsearch/mailbox-monitor.service';
import { User } from './user.interface';
import { ElasticService } from 'src/elasticsearch/eleasticsearch.service';
import { HttpService } from '@nestjs/axios';
import { AppLogger } from 'src/common';

@Injectable()
export class UserService {
  logger = new AppLogger(UserService.name, { timestamp: true });
  userIndex = process.env.ELASTICSEARCH_USER_INDEX || 'users';
  constructor(
    private readonly httpService: HttpService,
    private readonly mailboxMonitorService: MailboxMonitorService,
    private readonly elasticService: ElasticService,
  ) {}

  async findOrCreate(email, accessToken, refreshToken): Promise<User> {
    await this.elasticService.indexUser(email, {
      email,
      accessToken,
      refreshToken,
    });
    return await this.findByEmail(email);
  }

  async findByEmail(email: string): Promise<User> {
    return (await this.elasticService.getById(email, this.userIndex)) as User;
  }

  async syncEmailsFoldersData(user: any) {
    try {
      // sync folders data
      const response = await this.httpService
        .get('https://outlook.office.com/api/v2.0/me/mailFolders', {
          headers: {
            authorization: `Bearer ${user.accessToken}`,
          },
        })
        .toPromise();
      const foldersData = response.data.value;

      this.elasticService.indexEmailsFolders(user.email, foldersData);
    } catch (error) {
      this.logger.error('Error syncing mailbox folders data:', error);
    }
  }

  async syncEmailsData(user: any) {
    try {
      // sync emails data
      const response = await this.httpService
        .get('https://outlook.office.com/api/v2.0/me/messages', {
          headers: {
            authorization: `Bearer ${user.accessToken}`,
          },
        })
        .toPromise();
      const emailData = response.data.value;

      this.mailboxMonitorService.updateElasticsearch(user.email, emailData);
    } catch (error) {
      this.logger.error('Error syncing mailbox emails data:', error);
    }
  }

  async clearMailboxData(userEmail: string) {
    await this.elasticService.clearMailboxData(userEmail);
  }
}
