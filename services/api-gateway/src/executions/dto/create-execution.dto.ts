import { IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  prompt!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
