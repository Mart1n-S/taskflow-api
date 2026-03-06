import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { LoginResponse } from './interfaces/login-response.interface';
import type { JwtPayload, RawJwtPayload } from './interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials
   * @param email The user's email
   * @param password The user's plain text password
   * @returns The user without passwordHash or null if invalid
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<JwtPayload & { name: string }, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Generate JWT token for authenticated user
   * @param user The authenticated user
   * @returns Access token and user info
   */
  login(user: JwtPayload & { name: string }): LoginResponse {
    const payload: RawJwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
