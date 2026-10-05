import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentUser } from '../../common/auth/current-user.decorator.js';
import { Public } from '../../common/auth/public.decorator.js';
import type { CurrentUserView } from '../../common/auth/authenticated-request.js';
import { LoginDto } from './login.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Public()
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.username, body.password);
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    response.setHeader(
      'Set-Cookie',
      `pharmacy_session=${result.token}; Max-Age=28800; Expires=${result.expiresAt.toUTCString()}; Path=/api/v1; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
    );
    response.setHeader('Cache-Control', 'no-store');
    return { data: result.currentUser };
  }

  @Get('me')
  me(@CurrentUser() currentUser: CurrentUserView) {
    return { data: currentUser };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Public()
  async logout(
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.authService.logout(cookieHeader);
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    response.setHeader(
      'Set-Cookie',
      `pharmacy_session=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api/v1; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`,
    );
    response.setHeader('Cache-Control', 'no-store');
    return { data };
  }
}
