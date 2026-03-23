import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  issueToken(@Body() body: LoginRequestDto): ReturnType<AuthService['issueToken']> {
    return this.authService.issueToken(body.subject);
  }
}
