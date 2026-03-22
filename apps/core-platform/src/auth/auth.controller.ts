import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginRequest {
  subject: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  issueToken(@Body() body: LoginRequest): { accessToken: string } {
    return this.authService.issueToken(body.subject);
  }
}
