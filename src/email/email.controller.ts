import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { EmailService } from './email.service';
import { RateLimit } from 'nestjs-rate-limiter';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('folders')
  async getFolders(@Req() req): Promise<any[]> {
    const user = JSON.parse(req.cookies['user'] || {});
    return this.emailService.getFolders(user.email);
  }

  @Get('conversation/:id')
  async getEmail(
    @Param('id') id: string,
    @Query('subscriptionId') subscriptionId: string,
  ): Promise<any> {
    return this.emailService.getEmail(subscriptionId, { Id: id });
  }

  @Get('conversations/:parentFolderId')
  async getEmails(
    @Param('parentFolderId') parentFolderId: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Req() req,
  ): Promise<any> {
    const user = JSON.parse(req.cookies['user'] || {});
    return this.emailService.getEmails(
      user.email,
      parentFolderId,
      page,
      pageSize,
    );
  }

  @Get('search')
  async searchEmails(
    @Query('q') q: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Req() req,
  ): Promise<any> {
    const user = JSON.parse(req.cookies['user'] || {});
    return this.emailService.searchEmails(q, user.email, page, pageSize);
  }

  @RateLimit({
    keyPrefix: 'aync-mails',
    points: 1,
    duration: 10,
    errorMessage: 'Accounts cannot be synced more than once in per 10 seconds',
  })
  @Get('sync')
  async syncMailbox(@Req() req, @Res() res): Promise<any> {
    const user = JSON.parse(req.cookies['user'] || {});
    await this.emailService.syncMailbox(user.email);

    return res.json('Success');
  }
}
