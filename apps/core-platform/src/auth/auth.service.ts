import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  issueToken(subject?: string): { accessToken: string } {
    if (!subject) {
      throw new UnauthorizedException('subject is required');
    }

    return { accessToken: `dev-token-for-${subject}` };
  }
}
