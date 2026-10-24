import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';

export enum PostTypeDto {
  GENERAL = 'GENERAL',
  PRODUCT_PROMOTION = 'PRODUCT_PROMOTION',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export class CreatePostDto {
  @IsString()
  storeId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(PostTypeDto)
  type?: PostTypeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsString()
  productId?: string;
}