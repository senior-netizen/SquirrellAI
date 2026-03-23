import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_AUDIENCE, AUTH_ISSUER, AUTH_SUBJECT_PATTERN, AUTH_TOKEN_TTL_SECONDS } from './auth.constants';
import type { AuthTokenPayload } from './auth.types';

@Injectable()
export class AuthService {
  issueToken(subject?: string): { accessToken: string; expiresAt: string; tokenType: 'Bearer' } {
    if (!subject || !AUTH_SUBJECT_PATTERN.test(subject)) {
      throw new BadRequestException(
        'subject must be 3-64 characters and contain only letters, numbers, colon, underscore, or hyphen',
      );
    }

    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: AuthTokenPayload = {
      sub: subject,
      iss: AUTH_ISSUER,
      aud: AUTH_AUDIENCE,
      iat: issuedAt,
      exp: issuedAt + AUTH_TOKEN_TTL_SECONDS,
    };

    return {
      accessToken: this.signPayload(payload),
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      tokenType: 'Bearer',
    };
  }

  validateBearerToken(token?: string): AuthTokenPayload {
    if (!token) {
      throw new UnauthorizedException('bearer token is required');
    }

    const [encodedPayload, encodedSignature, ...extraSegments] = token.split('.');
    if (!encodedPayload || !encodedSignature || extraSegments.length > 0) {
      throw new UnauthorizedException('token format is invalid');
    }

    const expectedSignature = this.sign(encodedPayload);
    const actualSignature = Buffer.from(encodedSignature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    if (
      actualSignature.length !== expectedSignatureBuffer.length ||
      !timingSafeEqual(actualSignature, expectedSignatureBuffer)
    ) {
      throw new UnauthorizedException('token signature is invalid');
    }

    let payload: Partial<AuthTokenPayload>;

    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<AuthTokenPayload>;
    } catch {
      throw new UnauthorizedException('token payload is invalid');
    }

    this.assertPayload(payload);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      throw new UnauthorizedException('token has expired');
    }

    return payload;
  }

  private signPayload(payload: AuthTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    return `${encodedPayload}.${this.sign(encodedPayload)}`;
  }

  private sign(encodedPayload: string): string {
    return createHmac('sha256', this.getSigningSecret()).update(encodedPayload).digest('base64url');
  }

  private getSigningSecret(): string {
    return process.env.AUTH_TOKEN_SECRET ?? 'development-control-plane-secret';
  }

  private assertPayload(payload: Partial<AuthTokenPayload>): asserts payload is AuthTokenPayload {
    const issuedAt = payload.iat;
    const expiresAt = payload.exp;

    if (
      typeof payload.sub !== 'string' ||
      !AUTH_SUBJECT_PATTERN.test(payload.sub) ||
      payload.iss !== AUTH_ISSUER ||
      payload.aud !== AUTH_AUDIENCE ||
      !Number.isInteger(issuedAt) ||
      !Number.isInteger(expiresAt) ||
      expiresAt <= issuedAt ||
      expiresAt - issuedAt > AUTH_TOKEN_TTL_SECONDS
    ) {
      throw new UnauthorizedException('token claims are invalid');
    }
  }
}
