import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { AUTH_SUBJECT_PATTERN } from '../auth.constants';

export class LoginRequestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(AUTH_SUBJECT_PATTERN, {
    message: 'subject must be 3-64 characters and contain only letters, numbers, colon, underscore, or hyphen',
  })
  subject!: string;
}
