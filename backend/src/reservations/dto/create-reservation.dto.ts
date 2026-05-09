import {
  IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID,
  ArrayMinSize, ValidateNested, IsInt, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReservationItemDto {
  @IsUUID('4', { message: 'medicineId must be a valid UUID' })
  medicineId: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class CreateReservationDto {
  @IsUUID('4', { message: 'pharmacyId must be a valid UUID' })
  pharmacyId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one medicine item is required' })
  @ValidateNested({ each: true })
  @Type(() => ReservationItemDto)
  items: ReservationItemDto[];

  @IsOptional()
  @IsString()
  prescriptionImageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
