import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchRequestDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one medicine name is required' })
  @IsString({ each: true })
  medicineNames: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsString()
  locationNodeId?: string;

  @IsOptional()
  @IsString()
  insuranceId?: string;
}
