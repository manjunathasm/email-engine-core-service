import { Injectable } from '@nestjs/common';
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
    private readonly elasticService: ElasticService,
  ) {}

  async findOrCreate(email: string, user: Partial<User>): Promise<User> {
    await this.elasticService.indexUser(email, user);
    return await this.findByEmail(email);
  }

  async findByUserId(userId: string): Promise<User> {
    return await this.elasticService.getUserByUserId(userId);
  }

  async findByEmail(email: string): Promise<User> {
    return (await this.elasticService.getById(email, this.userIndex)) as User;
  }

  async findAllUsers(): Promise<User[]> {
    return await this.elasticService.getAllUsers();
  }

  async updateUser(email: string, user: Partial<User>) {
    await this.elasticService.indexUser(email, user);
  }

  async syncEmailsFoldersData(user: any) {
    try {
      let url = `${process.env.OUTLOOK_API_BASE_URL}/me/mailFolders`;
      do {
        // sync folders data
        const response = await this.httpService
          .get(url, {
            headers: { authorization: `Bearer ${user.accessToken}` },
          })
          .toPromise();
        const foldersData = response.data.value;

        this.elasticService.indexEmailsFolders(user.email, foldersData);
        url = response.data['@odata.nextLink'];
      } while (url);
    } catch (error) {
      this.logger.error(
        'Error syncing mailbox folders data: ' + error.toString(),
      );
    }
  }

  async syncEmailsData(user: any) {
    try {
      let url = `${process.env.OUTLOOK_API_BASE_URL}/me/messages`;
      do {
        // sync emails data
        const response = await this.httpService
          .get(url, {
            headers: { authorization: `Bearer ${user.accessToken}` },
          })
          .toPromise();
        const emailData = response.data.value;

        await this.elasticService.indexEmails(user.email, emailData);
        url = response.data['@odata.nextLink'];
      } while (url);
    } catch (error) {
      this.logger.error(
        'Error syncing mailbox emails data: ' + error.toString(),
      );
    }
  }

  async syncEmailsDelta(subscriptionId: string, ResourceData: any) {
    const user =
      await this.elasticService.getUserBySubscriptionId(subscriptionId);
    const response = await this.httpService
      .get(
        user.deltaLink ||
          `${process.env.OUTLOOK_API_BASE_URL}/me/messages/${ResourceData.Id}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        },
      )
      .toPromise();

    const email = response.data;

    await this.elasticService.indexEmails(user.userId, [email]);

    // Save new deltaLink for future syncs
    await this.updateUser(user.email, {
      deltaLink: response.data['@odata.deltaLink'],
    });
    return email;
  }

  async clearMailboxData(userEmail: string) {
    await this.elasticService.clearMailboxData(userEmail);
  }
}
