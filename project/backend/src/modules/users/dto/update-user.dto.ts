import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@company.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'employee', required: false })
  @IsEnum(['employee', 'manager', 'finance', 'admin', 'auditor'])
  @IsOptional()
  role?: string;

  @ApiProperty({ example: 'Engineering', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'CC-101', required: false })
  @IsString()
  @IsOptional()
  costCenter?: string;

  @ApiProperty({ example: 'manager_id_here', required: false })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
