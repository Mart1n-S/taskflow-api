import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { LoginResponse } from './interfaces/login-response.interface';
import { User } from '../users/entities/user.entity';

type RequestWithUser = ExpressRequest & { user: JwtPayload & { name: string } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Login with email and password
   * @returns Access token and user info
   */
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: RequestWithUser): LoginResponse {
    return this.authService.login(req.user);
  }

  /**
   * Get current authenticated user
   * @returns The current user
   */
  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<User> {
    return this.usersService.findOne(user.id);
  }
}
