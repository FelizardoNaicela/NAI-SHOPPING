import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StoreType } from '@prisma/client';

export class UpdateStoreDto {
  @IsOptional() @IsString() @MaxLength(500) avatarUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) bannerUrl?: string;
  @IsOptional() @IsEnum(StoreType) type?: StoreType;
}