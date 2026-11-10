import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReverseAdministrativeActionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reversalReason!: string;
}