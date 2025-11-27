import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTerritoryDto {
  @ApiProperty({ example: 'BKK1', description: 'Unique territory code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'กรุงเทพฯ เขตเหนือ' })
  @IsString()
  nameTh: string;

  @ApiProperty({ example: 'Bangkok North' })
  @IsString()
  nameEn: string;

  @ApiPropertyOptional({ example: 'Northern Bangkok area' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: ['กรุงเทพมหานคร'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  provinces?: string[];

  @ApiProperty({ example: 'uuid-of-company' })
  @IsString()
  companyId: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
