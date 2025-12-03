import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  CEO = 'CEO', // Chief Executive Officer
  SD = 'SD',   // Sale Director
  SM = 'SM',   // Sales Manager
  MM = 'MM',   // Marketing Manager
  PM = 'PM',   // Product Manager
  SUP = 'SUP', // Supervisor
  SR = 'SR',   // Sales Representative
}

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '0812345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SR })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'uuid-of-manager' })
  @IsOptional()
  @IsString()
  managerId?: string;

  @ApiProperty({ example: 'uuid-of-company' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ example: 'uuid-of-territory' })
  @IsOptional()
  @IsString()
  territoryId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-team' })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
