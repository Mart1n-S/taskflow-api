import type { JwtPayload } from './jwt-payload.interface';

/**
 * Interface representing the API response upon a successful connection.
 */
export interface LoginResponse {
  access_token: string;
  user: JwtPayload & { name: string };
}
