import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { AUTH_SUBJECT_PATTERN } from '../../auth/auth.constants';

export class CreateExecutionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(AUTH_SUBJECT_PATTERN, {
    message: 'agentId must be 3-64 characters and contain only letters, numbers, colon, underscore, or hyphen',
  })
  agentId!: string;

  @IsString()
  @MinLength(1)
  prompt!: string;
}
