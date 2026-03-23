import type { Request } from 'express';

export interface AuthTokenPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}
