import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  logger = new AppLogger(AuthService.name, { timestamp: true });
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  async syncMailbox(user: any) {
    await this.userService.syncEmailsFoldersData(user);
    await this.userService.syncEmailsData(user);
  }

  async refreshToken(userEmail: string) {
    const user = await this.userService.findByEmail(userEmail);
    const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
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

    return await this.userService.findOrCreate(
      user.email,
      rtoken.access_token,
      rtoken.refresh_token,
    );
  }

  async logout(userEmail: string): Promise<void> {
    try {
      const user = await this.userService.findByEmail(userEmail);

      await this.httpService
        .post(
          'https://login.microsoftonline.com/common/oauth2/v2.0/logout',
          null,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        )
        .toPromise();
      await this.userService.clearMailboxData(userEmail);
    } catch (error) {
      this.logger.error('Error logging out from Outlook:', error);
    }
  }
}
