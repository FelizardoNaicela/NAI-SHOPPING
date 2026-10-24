import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  IsUUID,
} from 'class-validator';

export class ListEvidenceByMessagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @IsUUID('4', { each: true })
  messageIds!: string[];
}