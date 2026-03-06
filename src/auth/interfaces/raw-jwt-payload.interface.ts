/**
 * RawJwtPayload represents the structure of the JWT payload as it is received from the client.
 */
export interface RawJwtPayload {
  sub: string;
  email: string;
  role: string;
}
