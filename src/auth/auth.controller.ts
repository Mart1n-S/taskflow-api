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
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import type { LoginResponse } from './interfaces/login-response.interface';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

type RequestWithUser = ExpressRequest & { user: JwtPayload & { name: string } };

@ApiTags('auth')
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
  @ApiOperation({ summary: 'Se connecter avec email et mot de passe' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Connexion réussie, retourne le token JWT' })
  @ApiUnauthorizedResponse({ description: 'Email ou mot de passe incorrect' })
  login(@Request() req: RequestWithUser): LoginResponse {
    return this.authService.login(req.user);
  }

  /**
   * Get current authenticated user
   * @returns The current user
   */
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiOkResponse({ description: "Profil de l'utilisateur connecté" })
  @ApiUnauthorizedResponse({ description: 'Token JWT manquant ou invalide' })
  me(@CurrentUser() user: JwtPayload): Promise<User> {
    return this.usersService.findOne(user.id);
  }
}
