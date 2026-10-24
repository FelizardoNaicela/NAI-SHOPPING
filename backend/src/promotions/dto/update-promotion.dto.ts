import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from "class-validator";

export class UpdatePromotionDto {

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxAppearances?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  productsPerCarousel?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

}