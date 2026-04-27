import { UserRole } from '../../users/enums/user-role.enum';
/**
 * Interface representing the payload of a JWT token.
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}
