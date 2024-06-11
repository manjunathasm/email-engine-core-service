import { Controller, Get, Render, Req } from '@nestjs/common';
import { ElasticService } from 'src/elasticsearch/eleasticsearch.service';

@Controller()
export class FrontendController {
  constructor(private readonly elasticService: ElasticService) {}

  @Get()
  @Render('index')
  getIndex() {
    return { message: 'Welcome to the Email Client' };
  }

  @Get('mails')
  @Render('mails')
  async getMailsList(@Req() req) {
    const user = JSON.parse(req.cookies['user'] || {});
    const mailFolders = await this.elasticService.getFoldersByUserEmail(
      user?.email,
    );
    return { user, mailFolders };
  }

  @Get('logout')
  @Render('logout')
  getSync() {
    return { message: 'Logout' };
  }
}
