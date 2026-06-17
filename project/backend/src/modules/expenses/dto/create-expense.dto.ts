import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ example: 120.5 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: 'travel' })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ example: 'CC-101' })
  @IsString()
  @IsNotEmpty()
  cost_center_id: string;

  @ApiProperty({ example: '2026-06-16' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'Flight booking to San Francisco' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://storage.googleapis.com/receipts/rec-01.jpg', required: false })
  @IsString()
  @IsOptional()
  receipt_url?: string;
}
