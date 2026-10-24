import {
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CreatePromotionDto {

  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  maxAppearances!: number;

  @IsInt()
  @Min(1)
  productsPerCarousel!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

}