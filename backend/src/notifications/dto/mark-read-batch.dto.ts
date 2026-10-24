import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class MarkReadBatchDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
