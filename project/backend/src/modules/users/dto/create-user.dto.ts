import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'employee' })
  @IsEnum(['employee', 'manager', 'finance', 'admin', 'auditor'])
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'CC-101' })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiProperty({ example: 'manager_id_here' })
  @IsString()
  @IsOptional()
  managerId?: string;
}
