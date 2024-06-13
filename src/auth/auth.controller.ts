import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AppLogger } from 'src/common';
import { WebhookService } from 'src/webhook/webhook.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  logger = new AppLogger(AuthController.name, { timestamp: true });
  constructor(
    private readonly authService: AuthService,
    private readonly webhookService: WebhookService,
  ) {}

  @Get('outlook/login')
  @UseGuards(AuthGuard('outlook'))
  async outlookLogin() {
    // Initiates OAuth flow
  }

  @Get('outlook/redirect')
  @UseGuards(AuthGuard('outlook'))
  async outlookRedirect(@Req() req, @Res() res) {
    const user = req.user;

    await this.authService.syncMailbox(user);

    // Create webhook subscription for real-time sync
    await this.webhookService.createSubscription(user);

    res.cookie('user', JSON.stringify(user), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Redirect to a success page or handle the response as needed
    return res.redirect('/mails');
  }

  @Patch('outlook/refresh/token')
  async refreshToken(
    @Body() body: { userEmail: string },
    @Req() req,
    @Res() res,
  ) {
    let user = { email: body.userEmail };
    if (!user.email) {
      user = JSON.parse(req.cookies['user'] || {});
    }
    user = await this.authService.refreshToken(user.email);

    res.cookie('user', JSON.stringify(user), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json(user);
  }

  @Post('outlook/notification')
  async handleNotification(
    @Param('validationtoken') validationtoken: string,
    @Body() body: any,
  ) {
    if (validationtoken) {
      // Handle Outlook webhook validation request
      return validationtoken;
    }

    // Process the notification payload
    this.logger.log(`Notification received: ${JSON.stringify(body)}`);

    await this.authService.handleNotification(body);

    return 'Notification received';
  }

  @Get('outlook/logout')
  async logout(@Req() req, @Res() res) {
    const user = JSON.parse(req.cookies['user'] || {});
    await this.authService.logout(user.email);

    // Clear the user cookie
    res.clearCookie('user');

    return res.redirect('/');
  }
}
