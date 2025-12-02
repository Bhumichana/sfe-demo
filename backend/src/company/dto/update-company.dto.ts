import { IsString, IsOptional, IsEmail, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'บริษัท ออเร็กซ์ จำกัด' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '0123456789012' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ example: '123 ถนนสุขุมวิท' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'บางนา' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'กรุงเทพมหานคร' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: '10260' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '02-123-4567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'contact@orex.co.th' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'https://orex.co.th' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ example: 'https://blob.vercel.app/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
