import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    res.cookie('user', JSON.stringify(user), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Redirect to a success page or handle the response as needed
    return res.redirect('/mails');
  }

  @Post('outlook/refresh/token')
  async refreshToken(@Req() req) {
    const user = JSON.parse(req.cookies['user'] || {});
    return await this.authService.refreshToken(user.email);
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
