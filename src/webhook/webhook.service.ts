import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from 'src/user/user.interface';
import { UserService } from 'src/user/user.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR) // Run every hour
  async handleCron() {
    this.logger.log('Job running handleCron.');
    // Retrieve all subscriptions from database or other storage
    const users = await this.userService.findAllUsers();

    for (const user of users) {
      if (user.subscriptionId) {
        await this.renewSubscription(user);
      }
    }
    this.logger.log('Job ended handleCron.');
  }

  async createSubscription(user: User) {
    const subscription = {
      '@odata.type': '#Microsoft.OutlookServices.PushSubscription',
      Resource: `${process.env.OUTLOOK_API_BASE_URL}/me/messages`,
      NotificationURL: process.env.WEBHOOK_NOTIFICATION_URL,
      ChangeType: 'Created,Updated,Deleted',
      SubscriptionExpirationDateTime: new Date(
        new Date().getTime() + 3600000,
      ).toISOString(),
    };

    try {
      const response = await this.httpService
        .post(
          `${process.env.OUTLOOK_API_BASE_URL}/me/subscriptions`,
          subscription,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .toPromise();

      // Save subscription details
      await this.userService.updateUser(user.email, {
        subscriptionId: response.data.Id,
        subscriptionExpirationDateTime:
          response.data.SubscriptionExpirationDateTime,
      });

      this.logger.log(`Created subscription: ${response.data.Id}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
      throw error; // Re-throw the error to propagate it up the chain
    }
  }

  async renewSubscription(user: User) {
    const subscription = {
      '@odata.type': '#Microsoft.OutlookServices.PushSubscription',
      SubscriptionExpirationDateTime: new Date(
        new Date().getTime() + 3600000,
      ).toISOString(),
    };

    const response = await this.httpService
      .patch(
        `${process.env.OUTLOOK_API_BASE_URL}/me/subscriptions/${user.subscriptionId}`,
        subscription,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .toPromise();

    // Save subscription details
    await this.userService.updateUser(user.email, {
      subscriptionId: response.data.Id,
      subscriptionExpirationDateTime:
        response.data.SubscriptionExpirationDateTime,
    });

    this.logger.log(`Renewed subscription: ${response.data.Id}`);
    return response.data;
  }

  async deleteSubscription(user: User) {
    await this.httpService
      .delete(
        `${process.env.OUTLOOK_API_BASE_URL}/me/subscriptions/${user.subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      )
      .toPromise();
  }
}
