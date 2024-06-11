import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { ElasticService } from 'src/elasticsearch/eleasticsearch.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly authService: AuthService,
    private readonly elasticService: ElasticService,
    private readonly userService: UserService,
  ) {}

  async getFolders(userEmail: string) {
    return await this.elasticService.getFoldersByUserEmail(userEmail);
  }

  async getEmails(userEmail, parentFolderId, page, pageSize) {
    return await this.elasticService.getEmails(
      userEmail,
      parentFolderId,
      page,
      pageSize,
    );
  }

  async searchEmails(q, userEmail, page, pageSize) {
    return await this.elasticService.searchEmails(q, userEmail, page, pageSize);
  }

  async syncMailbox(userEmail: string) {
    const user = await this.authService.refreshToken(userEmail);
    await this.userService.syncEmailsFoldersData(user);
    await this.userService.syncEmailsData(user);
  }
}
