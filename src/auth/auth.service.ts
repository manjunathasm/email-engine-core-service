import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common';
import { User } from 'src/user/user.interface';
import { UserService } from 'src/user/user.service';
import { WebhookService } from 'src/webhook/webhook.service';

@Injectable()
export class AuthService {
  logger = new AppLogger(AuthService.name, { timestamp: true });
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    private readonly webhookService: WebhookService,
  ) {}

  async syncMailbox(user: any) {
    await this.userService.syncEmailsFoldersData(user);
    await this.userService.syncEmailsData(user);
  }

  async refreshToken(userEmail: string): Promise<User> {
    const user = await this.userService.findByEmail(userEmail);
    const url = `${process.env.OUTLOOK_IDENTITY_API_BASE_URL}/token`;
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    const data = {
      client_id: process.env.OUTLOOK_CLIENT_ID,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET,
      // scope: 'openid profile offline_access',
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    };
    const rtoken = (
      await this.httpService.post(url, data, { headers }).toPromise()
    ).data;

    await this.userService.updateUser(user.email, {
      accessToken: rtoken.access_token,
      refreshToken: rtoken.refresh_token,
    });
    return {
      ...user,
      accessToken: rtoken.access_token,
      refreshToken: rtoken.refresh_token,
    };
  }

  async handleNotification(body: any) {
    for (const notification of body.value) {
      const { subscriptionId, ResourceData } = notification.ResourceData;

      if (ResourceData) {
        await this.userService.syncEmailsDelta(subscriptionId, ResourceData);
      }
    }
  }

  async logout(userEmail: string): Promise<void> {
    try {
      const user = await this.userService.findByEmail(userEmail);

      await this.webhookService.deleteSubscription(user);
      await this.userService.clearMailboxData(userEmail);

      await this.httpService
        .post(`${process.env.OUTLOOK_IDENTITY_API_BASE_URL}/logout`, null, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        .toPromise();
    } catch (error) {
      this.logger.error('Error logging out from Outlook:', error);
    }
  }
}
