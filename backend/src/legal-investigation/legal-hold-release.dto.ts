import { IsString, MaxLength, MinLength } from 'class-validator';

export class LegalHoldReleaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;
}