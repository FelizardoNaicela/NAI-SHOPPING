import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class ConfirmPaymentByReferenceDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;
}