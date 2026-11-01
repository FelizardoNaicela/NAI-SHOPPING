import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

import { StoreType } from '@prisma/client';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bannerUrl?: string;

  @IsOptional()
  @IsEnum(StoreType)
  type?: StoreType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  locationKeyword?: string;

  @IsOptional()
@IsString()
@IsUrl({
  require_protocol: true,
  protocols: ['http', 'https'],
})
@MaxLength(1000)
locationUrl?: string;
}