/**
 * Interface representing the payload of a JWT token.
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}
