import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { UserService } from 'src/user/user.service';

@Injectable()
export class OutlookStrategy extends PassportStrategy(Strategy, 'outlook') {
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {
    super({
      authorizationURL:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      clientID: process.env.OUTLOOK_CLIENT_ID,
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      passReqToCallback: true,
      scope: [
        'openid',
        'profile',
        'email',
        'offline_access',
        'https://outlook.office.com/IMAP.AccessAsUser.All',
        'https://outlook.office.com/Mail.ReadBasic',
        'https://outlook.office.com/Mail.Read',
        'https://outlook.office.com/Mail.ReadWrite',
      ],
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    params: any,
  ): Promise<any> {
    try {
      const profile = await this.getProfile(accessToken);
      const user = await this.userService.findOrCreate(
        profile.EmailAddress,
        accessToken,
        refreshToken,
      );
      return user;
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }

  async getProfile(accessToken: string): Promise<any> {
    try {
      const response = await this.httpService
        .get('https://outlook.office.com/api/v2.0/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json; odata.metadata=none',
          },
        })
        .toPromise();
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch user profile');
    }
  }
}
