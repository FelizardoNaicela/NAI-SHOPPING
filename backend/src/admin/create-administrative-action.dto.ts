import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import {
  AdministrativeActionType,
} from '@prisma/client';

export class CreateAdministrativeActionDto {
  @IsEnum(AdministrativeActionType)
  type!: AdministrativeActionType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}